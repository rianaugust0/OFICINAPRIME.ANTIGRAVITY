
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.workshop_role AS ENUM ('dono', 'mecanico', 'atendente');
CREATE TYPE public.order_status AS ENUM ('aguardando', 'em_andamento', 'pronto', 'entregue');
CREATE TYPE public.appointment_type AS ENUM ('entrada', 'entrega', 'revisao');
CREATE TYPE public.subscription_plan AS ENUM ('essencial', 'profissional', 'premium');

-- =========================
-- TABLES
-- =========================

CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text,
  email text,
  address text,
  logo_url text,
  plan public.subscription_plan NOT NULL DEFAULT 'essencial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workshop_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workshop_role NOT NULL DEFAULT 'mecanico',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, user_id)
);

CREATE INDEX idx_members_user ON public.workshop_members(user_id);
CREATE INDEX idx_members_workshop ON public.workshop_members(workshop_id);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  document text,
  notes text,
  last_service_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_workshop ON public.clients(workshop_id);

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  year int,
  plate text,
  color text,
  mileage int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_workshop ON public.vehicles(workshop_id);
CREATE INDEX idx_vehicles_client ON public.vehicles(client_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  number serial,
  reported_problem text,
  service_done text,
  parts_used text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'aguardando',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery date,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_workshop ON public.orders(workshop_id);
CREATE INDEX idx_orders_status ON public.orders(workshop_id, status);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  type public.appointment_type NOT NULL DEFAULT 'entrada',
  service text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_workshop_date ON public.appointments(workshop_id, scheduled_at);

-- =========================
-- SECURITY DEFINER HELPERS
-- =========================

CREATE OR REPLACE FUNCTION public.is_workshop_member(_user_id uuid, _workshop_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workshop_members
    WHERE user_id = _user_id AND workshop_id = _workshop_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workshop_role(_user_id uuid, _workshop_id uuid, _role public.workshop_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workshop_members
    WHERE user_id = _user_id AND workshop_id = _workshop_id AND role = _role
  );
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_workshops_updated BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- SIGNUP HANDLER
-- Creates profile + workshop + dono membership
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_workshop_id uuid;
  ws_name text;
  full_name text;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  ws_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'workshop_name', ''), 'Minha Oficina');

  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, full_name);

  INSERT INTO public.workshops (name, whatsapp, email)
  VALUES (ws_name, NEW.raw_user_meta_data->>'whatsapp', NEW.email)
  RETURNING id INTO new_workshop_id;

  INSERT INTO public.workshop_members (workshop_id, user_id, role)
  VALUES (new_workshop_id, NEW.id, 'dono');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- RLS
-- =========================
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- workshops
CREATE POLICY "members read workshop" ON public.workshops FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), id));
CREATE POLICY "owner updates workshop" ON public.workshops FOR UPDATE TO authenticated
  USING (public.has_workshop_role(auth.uid(), id, 'dono'));

-- workshop_members
CREATE POLICY "members read members" ON public.workshop_members FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "owner manages members insert" ON public.workshop_members FOR INSERT TO authenticated
  WITH CHECK (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));
CREATE POLICY "owner manages members update" ON public.workshop_members FOR UPDATE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));
CREATE POLICY "owner manages members delete" ON public.workshop_members FOR DELETE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));

-- generic helper: members can SELECT/INSERT/UPDATE; only owner can DELETE
CREATE POLICY "members read clients" ON public.clients FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members insert clients" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members update clients" ON public.clients FOR UPDATE TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "owner deletes clients" ON public.clients FOR DELETE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));

CREATE POLICY "members read vehicles" ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members insert vehicles" ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members update vehicles" ON public.vehicles FOR UPDATE TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "owner deletes vehicles" ON public.vehicles FOR DELETE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));

CREATE POLICY "members read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "owner deletes orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'));

CREATE POLICY "members read appointments" ON public.appointments FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
CREATE POLICY "members delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));
