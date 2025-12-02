import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { unit_id } = await req.json();

    if (!unit_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if unit already has an active (non-deleted) kitchen
    const { data: existingKitchens } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id")
      .eq("unit_id", unit_id)
      .eq("role", "kitchen");

    if (existingKitchens && existingKitchens.length > 0) {
      // Check if any of these kitchens is not soft-deleted
      for (const kitchen of existingKitchens) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("deleted_at")
          .eq("id", kitchen.user_id)
          .single();
        
        if (profile && !profile.deleted_at) {
          return new Response(
            JSON.stringify({ error: "Esta unidade já possui uma cozinha" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Generate unique 5-digit identifier
    let identifier = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      identifier = String(Math.floor(10000 + Math.random() * 90000));
      
      const { data: existingKitchen } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("full_name", `KITCHEN-${identifier}`)
        .single();

      if (!existingKitchen) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar um identificador único" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with generated email
    const email = `kitchen-${identifier}@foodflow.internal`;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: identifier,
      email_confirm: true,
      user_metadata: { full_name: `KITCHEN-${identifier}` },
    });

    if (createError) throw createError;

    // Insert into profiles table
    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name: `KITCHEN-${identifier}`,
        unit_id: unit_id
      });

    if (profileInsertError) {
      console.error('Erro ao criar perfil da cozinha:', profileInsertError);
      // Try to delete the user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Erro ao criar perfil da cozinha');
    }

    // Create user role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "kitchen", unit_id });

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id, identifier }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
