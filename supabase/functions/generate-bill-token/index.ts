import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Check if user is waiter or admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['waiter', 'admin']);

    if (!roles || roles.length === 0) {
      throw new Error('Sem permissão');
    }

    const { tableId } = await req.json();

    if (!tableId) {
      throw new Error('ID da mesa não fornecido');
    }

    // Verify table exists and is in correct status
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, status')
      .eq('id', tableId)
      .single();

    if (tableError || !table) {
      throw new Error('Mesa não encontrada');
    }

    // Generate random token
    const billToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // Token expires in 2 hours

    // Store token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('bill_tokens')
      .insert({
        table_id: tableId,
        token: billToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      throw new Error('Erro ao gerar token');
    }

    console.log('Bill token generated:', { tableId, expiresAt });

    return new Response(
      JSON.stringify({ token: billToken, expiresAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-bill-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
