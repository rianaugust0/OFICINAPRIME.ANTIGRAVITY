import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobRow {
  msg_id: number;
  read_ct: number;
  job_id: string;
  workshop_id: string;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

/**
 * Execute a single automation job. Returns { ok, error }.
 * Currently all WhatsApp jobs are "logical sends" (the actual wa.me link is opened
 * client-side). Server-side here we validate payload and mark as sent. When a real
 * WhatsApp HTTP gateway is integrated later, replace the body of each case.
 */
async function executeJob(job: JobRow): Promise<{ ok: boolean; error?: string }> {
  try {
    switch (job.kind) {
      case "whatsapp_order_ready":
      case "whatsapp_payment_due":
      case "whatsapp_appointment_reminder":
      case "whatsapp_custom": {
        const phone = (job.payload?.phone as string | undefined)?.replace(/\D/g, "");
        const message = job.payload?.message as string | undefined;
        if (!phone || phone.length < 10) return { ok: false, error: "Telefone inválido" };
        if (!message || message.length < 1) return { ok: false, error: "Mensagem vazia" };
        // Simulated successful "queued for delivery". Real HTTP send goes here.
        return { ok: true };
      }
      default:
        return { ok: false, error: `Tipo desconhecido: ${job.kind}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let batchSize = 10;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.batch === "number") batchSize = Math.min(50, Math.max(1, body.batch));
    }
  } catch { /* ignore */ }

  const { data: jobs, error: dqErr } = await admin.rpc("dequeue_automations", {
    _batch: batchSize,
    _vt: 60,
  });

  if (dqErr) {
    return new Response(JSON.stringify({ error: dqErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const list = (jobs ?? []) as JobRow[];
  let sent = 0, failed = 0;

  for (const job of list) {
    const result = await executeJob(job);
    if (result.ok) {
      await admin.rpc("complete_automation", { _job_id: job.job_id, _msg_id: job.msg_id });
      sent++;
    } else {
      await admin.rpc("fail_automation", {
        _job_id: job.job_id, _msg_id: job.msg_id, _error: result.error ?? "erro",
      });
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed: list.length, sent, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
