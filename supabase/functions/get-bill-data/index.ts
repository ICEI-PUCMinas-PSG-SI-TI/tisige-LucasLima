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

    const { tableId, token } = await req.json();

    if (!tableId || !token) {
      throw new Error('ID da mesa e token são obrigatórios');
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('bill_tokens')
      .select('id, table_id, expires_at')
      .eq('token', token)
      .eq('table_id', tableId)
      .single();

    if (tokenError || !tokenData) {
      console.error('Invalid token:', { tableId, token: token.substring(0, 8) });
      throw new Error('Token inválido ou expirado');
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.error('Token expired:', { tableId, expiresAt });
      throw new Error('Token expirado');
    }

    // Fetch table data
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single();

    if (tableError || !tableData) {
      throw new Error('Mesa não encontrada');
    }

    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        menu_items (name, price)
      `)
      .eq('table_id', tableId);

    if (ordersError) {
      throw new Error('Erro ao carregar pedidos');
    }

    console.log('Bill data fetched successfully:', { tableId });

    return new Response(
      JSON.stringify({
        table: tableData,
        orders: ordersData || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-bill-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
