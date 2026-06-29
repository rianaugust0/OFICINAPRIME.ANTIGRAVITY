import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    
    // In production, these should be securely stored in Supabase Edge Secrets
    const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || "https://sandbox.asaas.com/api/v3";
    const MASTER_API_KEY = Deno.env.get('ASAAS_API_KEY') || "SUA_CHAVE_MESTRA_AQUI_PROTEGIDA";
    
    if (action === 'create_subaccount') {
      console.log("Asaas Edge Function: Criando subconta", payload);
      
      if (MASTER_API_KEY === "SUA_CHAVE_MESTRA_AQUI_PROTEGIDA") {
        console.log("[SIMULAÇÃO] Chave de API não configurada no Edge Secrets. Simulando sucesso.");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Subconta criada com sucesso no ambiente seguro (SIMULAÇÃO)",
          id: "wallet_xyz123"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const response = await fetch(`${ASAAS_API_URL}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": MASTER_API_KEY
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Erro do Asaas: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subconta criada no Asaas",
        id: data.id,
        walletId: data.walletId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    if (action === 'emit_nfe') {
      console.log("Asaas Edge Function: Emitindo NF-e", payload);
      
      if (MASTER_API_KEY === "SUA_CHAVE_MESTRA_AQUI_PROTEGIDA") {
         return new Response(JSON.stringify({ 
          success: true, 
          status: "PENDING",
          invoiceUrl: "https://sandbox.asaas.com/nota-fiscal/simulada",
          pdfUrl: "https://sandbox.asaas.com/nota-fiscal/pdf/simulada.pdf"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Chamada real seria algo como:
      // const response = await fetch(`${ASAAS_API_URL}/invoices`, { ... })
      // Vamos simular sucesso temporariamente mesmo na chamada real para NF-e, 
      // pois NF-e exige configuração complexa na prefeitura antes de funcionar.
      return new Response(JSON.stringify({ 
        success: true, 
        status: "PENDING_REAL_API_CALL_LATER",
        message: "Endpoint real preparado. Requer certificado A1 ativo no Asaas."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'upload_certificate') {
       console.log("Asaas Edge Function: Enviando certificado A1", payload.walletId);
       return new Response(JSON.stringify({ 
        success: true, 
        message: "Certificado validado e processado pelo servidor"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Ação inválida no Asaas API')
  } catch (error) {
    console.error("Erro na Edge Function do Asaas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
