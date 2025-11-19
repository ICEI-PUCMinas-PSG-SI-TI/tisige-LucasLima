import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createUserSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128, 'Senha muito longa'),
  fullName: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: z.enum(['waiter', 'kitchen', 'admin'], { invalid_type_error: 'Função inválida' }),
  unitId: z.string().uuid('ID de unidade inválido').nullable().optional(),
})

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

    // Check if this is a bootstrap request (creating first admin)
    const { count: adminCount } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    const isBootstrap = adminCount === 0

    // Verify that the requesting user is an admin (unless bootstrap)
    if (!isBootstrap) {
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
        throw new Error('Apenas administradores podem criar usuários')
      }
    }


    // Parse and validate request body
    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors)
      return new Response(
        JSON.stringify({
          success: false,
          error: parsed.error.errors[0].message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { email, password, fullName, role, unitId } = parsed.data

    console.log(`Criando usuário: ${email} com role ${role} e unidade ${unitId}`)

    // Create the user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log(`Usuário criado com ID: ${newUser.user.id}`)

    // Update profile with unit_id
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ unit_id: unitId || null })
      .eq('id', newUser.user.id)

    if (profileUpdateError) {
      console.error('Erro ao atualizar perfil com unit_id:', profileUpdateError)
      // Try to delete the user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error('Erro ao atualizar unidade do perfil')
    }

    // Assign the role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        unit_id: unitId || null
      })

    if (roleInsertError) {
      console.error('Erro ao atribuir role:', roleInsertError)
      // Try to delete the user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error('Erro ao atribuir função ao usuário')
    }

    console.log(`Role ${role} e unidade atribuídos ao usuário ${newUser.user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        user: newUser.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erro na função create-user:', error)
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