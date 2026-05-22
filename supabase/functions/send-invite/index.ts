import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  role: "dono" | "mecanico" | "atendente";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userRes.user;

    const body = (await req.json()) as InvitePayload;
    const email = (body.email ?? "").trim().toLowerCase();
    const role = body.role ?? "mecanico";

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!["dono", "mecanico", "atendente"].includes(role)) {
      return new Response(JSON.stringify({ error: "Papel inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find user's workshop where they are owner
    const { data: membership, error: memErr } = await userClient
      .from("workshop_members")
      .select("workshop_id, role, workshops(name)")
      .eq("user_id", user.id)
      .eq("role", "dono")
      .limit(1)
      .maybeSingle();

    if (memErr || !membership) {
      return new Response(JSON.stringify({ error: "Apenas o dono pode convidar" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Insert invite (using user client respects RLS — owner can insert)
    const { data: invite, error: invErr } = await userClient
      .from("workshop_invites")
      .insert({
        workshop_id: membership.workshop_id,
        email,
        role,
        invited_by: user.id,
      })
      .select("id, token, expires_at")
      .single();

    if (invErr) {
      return new Response(JSON.stringify({ error: invErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build signup URL with prefilled email
    const origin = req.headers.get("origin") ?? "";
    const signupUrl = `${origin}/signup?email=${encodeURIComponent(email)}&invite=${invite.token}`;

    return new Response(
      JSON.stringify({
        success: true,
        invite,
        signupUrl,
        workshopName: (membership as any).workshops?.name ?? "a oficina",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
