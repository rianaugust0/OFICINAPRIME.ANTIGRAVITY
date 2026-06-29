import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message } = await req.json()
    
    // In production, these should be securely stored in Supabase Edge Secrets
    const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || "https://api.z-api.io/instances/xyz";
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') || "SEU_TOKEN_SECRETO_DO_WHATSAPP";
    
    console.log(`WhatsApp Edge Function: Enviando mensagem para ${to}: ${message}`);
    
    if (WHATSAPP_TOKEN === "SEU_TOKEN_SECRETO_DO_WHATSAPP") {
      console.log("[SIMULAÇÃO] Token do WhatsApp não configurado. Simulando disparo.");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "WhatsApp disparado com segurança pelo Backend (SIMULAÇÃO)"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    // Disparo real
    const response = await fetch(`${WHATSAPP_API_URL}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({ phone: to, message: message })
    });
    
    const data = await response.json();

    if (!response.ok) {
       throw new Error(`Erro do provedor de WhatsApp: ${JSON.stringify(data)}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "WhatsApp disparado com sucesso no servidor",
      responseId: data.id || "enviado"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Erro na Edge Function do WhatsApp:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
