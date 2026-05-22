import { supabase } from "@/integrations/supabase/client";

export type AutomationKind =
  | "whatsapp_order_ready"
  | "whatsapp_payment_due"
  | "whatsapp_appointment_reminder"
  | "whatsapp_custom";

export interface AutomationPayload {
  phone: string;
  message: string;
  client_name?: string;
  reference?: string; // OS#, agendamento id, etc
}

/**
 * Enqueue an automation job. Returns the job id.
 * The server-side worker (process-automations) will pick it up within ~1 min,
 * with retry/backoff on failure (up to 5 attempts) and DLQ after that.
 */
export async function enqueueAutomation(
  workshopId: string,
  kind: AutomationKind,
  payload: AutomationPayload,
  delaySeconds = 0,
): Promise<string> {
  const { data, error } = await supabase.rpc("enqueue_automation", {
    _workshop_id: workshopId,
    _kind: kind,
    _payload: payload as never,
    _delay_seconds: delaySeconds,
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function retryAutomation(jobId: string): Promise<void> {
  const { error } = await supabase.rpc("retry_automation", { _job_id: jobId });
  if (error) throw error;
}
