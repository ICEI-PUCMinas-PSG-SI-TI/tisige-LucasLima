import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SoftDeleteUserRequest {
  userId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify that the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir usuários')
    }

    // Parse request body
    const { userId }: SoftDeleteUserRequest = await req.json()

    if (!userId) {
      throw new Error('userId é obrigatório')
    }

    console.log(`Realizando soft delete do usuário: ${userId}`)

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      throw new Error('Você não pode excluir sua própria conta')
    }

    // Check if user is admin (prevent deleting admins)
    const { data: targetRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (targetRoleData?.role === 'admin') {
      throw new Error('Não é possível excluir usuários administradores')
    }

    // Step 1: Ban user in Auth (primary action)
    console.log('Banindo usuário no Auth...')
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' }
    )

    if (banError) {
      console.error('Erro ao banir usuário:', banError)
      throw new Error('Erro ao banir usuário no sistema de autenticação')
    }

    console.log('Usuário banido com sucesso no Auth')

    // Step 2: Try to soft delete in profiles (best effort)
    console.log('Tentando atualizar perfil...')
    const { error: updateError, count } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar perfil (não crítico):', updateError)
    } else if (count === 0) {
      console.log('Perfil não encontrado na tabela profiles (usuário antigo), mas banimento foi bem-sucedido')
    } else {
      console.log(`Perfil atualizado com sucesso (${count} registro(s))`)
    }

    console.log(`Soft delete realizado com sucesso para usuário ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário excluído com sucesso',
        details: {
          banned: true,
          profileUpdated: count !== 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erro na função soft-delete-user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
