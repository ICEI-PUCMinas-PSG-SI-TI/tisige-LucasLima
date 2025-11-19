import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const updateUserSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
  fullName: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: z.enum(['admin', 'waiter', 'kitchen'], { invalid_type_error: 'Função inválida' }),
  unitId: z.string().uuid('ID de unidade inválido').nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Token inválido');
    }

    // Check if the requesting user is an admin
    const { data: adminRoleData, error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminRoleError || adminRoleData?.role !== 'admin') {
      throw new Error('Apenas administradores podem atualizar usuários');
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: parsed.error.errors[0].message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const { userId, fullName, role, unitId } = parsed.data;

    console.log('Updating user profile');

    // Update the user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: fullName,
        unit_id: unitId || null
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    // Update the user's role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ 
        role,
        unit_id: unitId || null
      })
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error updating role:', roleError);
      throw new Error(`Erro ao atualizar função: ${roleError.message}`);
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in update-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
