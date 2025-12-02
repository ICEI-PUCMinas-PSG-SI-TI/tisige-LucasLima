import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SoftDeleteUserRequest {
  user_id: string
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
    const body = await req.json()
    console.log('Request body received:', body)
    
    const { user_id }: SoftDeleteUserRequest = body

    if (!user_id) {
      console.error('user_id not found in body:', body)
      throw new Error('userId é obrigatório')
    }

    console.log(`Iniciando soft delete do usuário: ${user_id}`)

    // Prevent admin from deleting themselves
    if (user_id === user.id) {
      throw new Error('Você não pode excluir sua própria conta')
    }

    // Check if target user is admin (prevent deleting admins)
    const { data: targetRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    if (targetRoleData?.role === 'admin') {
      throw new Error('Não é possível excluir usuários administradores')
    }

    // PASSO PRINCIPAL: Ban user in Auth (this is the critical action)
    console.log('Banindo usuário no sistema de autenticação...')
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { ban_duration: '876000h' }
    )

    if (banError) {
      console.error('Erro crítico ao banir usuário:', banError)
      throw new Error('Erro ao banir usuário no sistema de autenticação')
    }

    console.log('✓ Usuário banido com sucesso')

    // PASSO SECUNDÁRIO: Try to soft delete in profiles (best effort, non-critical)
    let profileUpdated = false
    try {
      console.log('Tentando marcar perfil como deletado...')
      const { error: updateError, count } = await supabaseAdmin
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user_id)

      if (updateError) {
        console.warn('Aviso: Erro ao atualizar perfil (não crítico):', updateError.message)
      } else if (count === 0) {
        console.warn('Aviso: Perfil não encontrado na tabela profiles (usuário sem perfil)')
      } else {
        console.log(`✓ Perfil marcado como deletado (${count} registro)`)
        profileUpdated = true
      }
    } catch (profileError) {
      // Ignore any errors from profile update - the ban is what matters
      console.warn('Aviso: Exceção ao atualizar perfil (ignorada):', profileError)
    }

    console.log(`✓ Soft delete concluído com sucesso para usuário ${user_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário desativado/banido',
        details: {
          banned: true,
          profileUpdated: profileUpdated
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
