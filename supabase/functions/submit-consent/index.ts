import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tableId, consentGiven, phone } = await req.json();

    console.log('Processing consent submission for table:', tableId);

    // Validate required fields
    if (!tableId || typeof consentGiven !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone is required when consent is given
    if (consentGiven && !phone) {
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório para receber promoções' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone format (Brazilian format) if provided and consent is given
    if (consentGiven && phone) {
      const brazilianPhoneRegex = /^(\(?\d{2}\)?\s?)?(9\d{4}-?\d{4}|\d{4}-?\d{4})$/;
      if (!brazilianPhoneRegex.test(phone.trim())) {
        return new Response(
          JSON.stringify({ error: 'Formato inválido. Use: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify the table exists and is in a valid state
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, status')
      .eq('id', tableId)
      .single();

    if (tableError || !table) {
      console.error('Table validation failed:', tableError);
      return new Response(
        JSON.stringify({ error: 'Invalid table ID' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (table.status !== 'occupied') {
      return new Response(
        JSON.stringify({ error: 'Table is not in a valid state for consent submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for recent submissions from this table (basic rate limiting)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentConsents, error: recentError } = await supabase
      .from('consent_log')
      .select('id')
      .eq('table_id', tableId)
      .gte('created_at', fiveMinutesAgo);

    if (recentError) {
      console.error('Error checking recent consents:', recentError);
    }

    if (recentConsents && recentConsents.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many consent submissions. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the consent record
    const { data: consent, error: insertError } = await supabase
      .from('consent_log')
      .insert({
        table_id: tableId,
        consent_given: consentGiven,
        phone: consentGiven && phone ? phone.trim() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting consent:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to record consent' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consent recorded successfully:', consent.id);

    return new Response(
      JSON.stringify({ success: true, data: consent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});