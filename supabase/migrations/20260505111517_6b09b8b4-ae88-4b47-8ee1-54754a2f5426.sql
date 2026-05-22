
-- 1) Add paid_at column to orders for accurate financial reporting
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
UPDATE public.orders SET paid_at = updated_at WHERE paid = true AND paid_at IS NULL;

-- 2) Trigger: keep paid_at in sync with paid
CREATE OR REPLACE FUNCTION public.sync_order_paid_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.paid = true AND NEW.paid_at IS NULL THEN
      NEW.paid_at = now();
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.paid = true AND (OLD.paid IS DISTINCT FROM true) THEN
      NEW.paid_at = now();
    ELSIF NEW.paid = false AND OLD.paid = true THEN
      NEW.paid_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_sync_paid_at ON public.orders;
CREATE TRIGGER trg_orders_sync_paid_at
BEFORE INSERT OR UPDATE OF paid ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_paid_at();

-- 3) updated_at trigger to keep timestamps reliable
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workshops_updated_at ON public.workshops;
CREATE TRIGGER trg_workshops_updated_at
BEFORE UPDATE ON public.workshops
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Lock down workshop-logos bucket: drop broad policies, add per-workshop ones
DROP POLICY IF EXISTS "Logos públicos são visíveis" ON storage.objects;
DROP POLICY IF EXISTS "Public read workshop-logos" ON storage.objects;
DROP POLICY IF EXISTS "owners upload workshop logos" ON storage.objects;
DROP POLICY IF EXISTS "owners update workshop logos" ON storage.objects;
DROP POLICY IF EXISTS "owners delete workshop logos" ON storage.objects;

-- Anyone can read individual logo files (needed since URL is public on sidebar)
CREATE POLICY "read workshop logo files"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-logos');

-- Only workshop owners can upload to their own folder
CREATE POLICY "owners upload workshop logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);

CREATE POLICY "owners update workshop logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);

CREATE POLICY "owners delete workshop logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);

-- 5) Helpful indexes for performance with multiple workshops
CREATE INDEX IF NOT EXISTS idx_orders_workshop ON public.orders(workshop_id);
CREATE INDEX IF NOT EXISTS idx_orders_workshop_paid_at ON public.orders(workshop_id, paid_at DESC) WHERE paid = true;
CREATE INDEX IF NOT EXISTS idx_orders_workshop_status ON public.orders(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_workshop ON public.clients(workshop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_workshop ON public.vehicles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_workshop_date ON public.appointments(workshop_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workshop_members_user ON public.workshop_members(user_id);
