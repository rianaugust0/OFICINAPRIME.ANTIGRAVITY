-- MIGRATION: Phase 2 & 3 (Fornecedores, Orçamentos e Regras de Automação)

-- 1. Create Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  document TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers of their workshop"
ON public.suppliers FOR SELECT
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can insert suppliers for their workshop"
ON public.suppliers FOR INSERT
WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can update suppliers of their workshop"
ON public.suppliers FOR UPDATE
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can delete suppliers of their workshop"
ON public.suppliers FOR DELETE
USING (public.is_workshop_member(auth.uid(), workshop_id));


-- 2. Create Quotes Table
CREATE TYPE quote_status AS ENUM ('novo', 'contato_feito', 'analise', 'aprovado', 'recusado');

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status quote_status NOT NULL DEFAULT 'novo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes of their workshop"
ON public.quotes FOR SELECT
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can insert quotes for their workshop"
ON public.quotes FOR INSERT
WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can update quotes of their workshop"
ON public.quotes FOR UPDATE
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can delete quotes of their workshop"
ON public.quotes FOR DELETE
USING (public.is_workshop_member(auth.uid(), workshop_id));


-- 3. Create Automation Rules Table
CREATE TYPE automation_rule_type AS ENUM ('service_reminder', 'birthday', 'feedback', 'payment');

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type automation_rule_type NOT NULL,
  trigger_condition TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automation rules of their workshop"
ON public.automation_rules FOR SELECT
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can insert automation rules for their workshop"
ON public.automation_rules FOR INSERT
WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can update automation rules of their workshop"
ON public.automation_rules FOR UPDATE
USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "Users can delete automation rules of their workshop"
ON public.automation_rules FOR DELETE
USING (public.is_workshop_member(auth.uid(), workshop_id));

-- Realtime replication (assuming realtime is already enabled, we add tables to publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
