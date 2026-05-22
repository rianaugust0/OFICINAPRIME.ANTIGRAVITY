-- Extensions needed
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the durable queue
SELECT pgmq.create('automations');

-- Status enum
DO $$ BEGIN
  CREATE TYPE public.automation_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'dlq');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.automation_kind AS ENUM (
    'whatsapp_order_ready',
    'whatsapp_payment_due',
    'whatsapp_appointment_reminder',
    'whatsapp_custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Audit/log table
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL,
  kind public.automation_kind NOT NULL,
  status public.automation_status NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  last_error text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  msg_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_jobs_workshop_idx ON public.automation_jobs(workshop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_jobs_status_idx ON public.automation_jobs(status, scheduled_for);

-- updated_at trigger
DROP TRIGGER IF EXISTS automation_jobs_updated_at ON public.automation_jobs;
CREATE TRIGGER automation_jobs_updated_at
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read automation jobs"
  ON public.automation_jobs FOR SELECT
  TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "members insert automation jobs"
  ON public.automation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "owner updates automation jobs"
  ON public.automation_jobs FOR UPDATE
  TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'::workshop_role));

CREATE POLICY "owner deletes automation jobs"
  ON public.automation_jobs FOR DELETE
  TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'::workshop_role));

-- ====== RPCs (SECURITY DEFINER) ======

-- Enqueue a job: creates audit row + sends pgmq message linking via msg_id
CREATE OR REPLACE FUNCTION public.enqueue_automation(
  _workshop_id uuid,
  _kind public.automation_kind,
  _payload jsonb,
  _delay_seconds int DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  job_id uuid;
  message_id bigint;
BEGIN
  -- Auth: only members can enqueue for their workshop
  IF NOT public.is_workshop_member(auth.uid(), _workshop_id) THEN
    RAISE EXCEPTION 'Not a member of workshop %', _workshop_id USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.automation_jobs (workshop_id, kind, payload, scheduled_for)
  VALUES (_workshop_id, _kind, COALESCE(_payload, '{}'::jsonb), now() + make_interval(secs => _delay_seconds))
  RETURNING id INTO job_id;

  SELECT pgmq.send(
    queue_name => 'automations',
    msg => jsonb_build_object('job_id', job_id),
    delay => _delay_seconds
  ) INTO message_id;

  UPDATE public.automation_jobs SET msg_id = message_id WHERE id = job_id;
  RETURN job_id;
END;
$$;

-- Worker: read a batch (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.dequeue_automations(_batch int DEFAULT 10, _vt int DEFAULT 60)
RETURNS TABLE (msg_id bigint, read_ct int, message jsonb, job_id uuid, workshop_id uuid, kind public.automation_kind, payload jsonb, attempts int, max_attempts int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY
  WITH popped AS (
    SELECT q.msg_id, q.read_ct, q.message
    FROM pgmq.read('automations', _vt, _batch) q
  ),
  marked AS (
    UPDATE public.automation_jobs j
    SET status = 'processing', attempts = j.attempts + 1, updated_at = now()
    FROM popped p
    WHERE j.id = (p.message->>'job_id')::uuid
      AND j.scheduled_for <= now()
    RETURNING j.id, j.workshop_id, j.kind, j.payload, j.attempts, j.max_attempts, p.msg_id, p.read_ct, p.message
  )
  SELECT m.msg_id, m.read_ct, m.message, m.id, m.workshop_id, m.kind, m.payload, m.attempts, m.max_attempts FROM marked m;
END;
$$;

-- Mark success
CREATE OR REPLACE FUNCTION public.complete_automation(_job_id uuid, _msg_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  UPDATE public.automation_jobs
  SET status = 'sent', processed_at = now(), last_error = NULL, updated_at = now()
  WHERE id = _job_id;
  PERFORM pgmq.delete('automations', _msg_id);
END;
$$;

-- Mark failure with retry (exponential backoff in seconds: 30, 120, 300, 900, 1800)
CREATE OR REPLACE FUNCTION public.fail_automation(_job_id uuid, _msg_id bigint, _error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  j record;
  backoff int;
BEGIN
  SELECT * INTO j FROM public.automation_jobs WHERE id = _job_id;
  IF NOT FOUND THEN
    PERFORM pgmq.delete('automations', _msg_id);
    RETURN;
  END IF;

  IF j.attempts >= j.max_attempts THEN
    UPDATE public.automation_jobs
    SET status = 'dlq', last_error = _error, processed_at = now(), updated_at = now()
    WHERE id = _job_id;
    PERFORM pgmq.archive('automations', _msg_id);
  ELSE
    backoff := CASE j.attempts
      WHEN 1 THEN 30
      WHEN 2 THEN 120
      WHEN 3 THEN 300
      WHEN 4 THEN 900
      ELSE 1800
    END;
    UPDATE public.automation_jobs
    SET status = 'pending', last_error = _error, scheduled_for = now() + make_interval(secs => backoff), updated_at = now()
    WHERE id = _job_id;
    -- Make message visible again after backoff (set vt)
    PERFORM pgmq.set_vt('automations', _msg_id, backoff);
  END IF;
END;
$$;

-- Manual retry (owner can re-enqueue a failed/dlq job)
CREATE OR REPLACE FUNCTION public.retry_automation(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  j record;
  message_id bigint;
BEGIN
  SELECT * INTO j FROM public.automation_jobs WHERE id = _job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF NOT public.has_workshop_role(auth.uid(), j.workshop_id, 'dono'::workshop_role) THEN
    RAISE EXCEPTION 'Only owner can retry' USING ERRCODE = '42501';
  END IF;

  UPDATE public.automation_jobs
  SET status = 'pending', attempts = 0, last_error = NULL, scheduled_for = now(), updated_at = now()
  WHERE id = _job_id;

  SELECT pgmq.send('automations', jsonb_build_object('job_id', _job_id), 0) INTO message_id;
  UPDATE public.automation_jobs SET msg_id = message_id WHERE id = _job_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.enqueue_automation(uuid, public.automation_kind, jsonb, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_automation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dequeue_automations(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_automation(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_automation(uuid, bigint, text) TO service_role;