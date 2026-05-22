
CREATE TABLE public.workshop_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL,
  email text NOT NULL,
  role workshop_role NOT NULL DEFAULT 'mecanico',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workshop_invites_email ON public.workshop_invites (lower(email));
CREATE INDEX idx_workshop_invites_workshop ON public.workshop_invites (workshop_id);

ALTER TABLE public.workshop_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read invites"
  ON public.workshop_invites FOR SELECT TO authenticated
  USING (public.is_workshop_member(auth.uid(), workshop_id));

CREATE POLICY "owner creates invites"
  ON public.workshop_invites FOR INSERT TO authenticated
  WITH CHECK (public.has_workshop_role(auth.uid(), workshop_id, 'dono'::workshop_role));

CREATE POLICY "owner deletes invites"
  ON public.workshop_invites FOR DELETE TO authenticated
  USING (public.has_workshop_role(auth.uid(), workshop_id, 'dono'::workshop_role));

-- Update handle_new_user to auto-accept invites if email matches
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_workshop_id uuid;
  ws_name text;
  full_name text;
  invite_record record;
  has_invite boolean := false;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, full_name);

  -- Check for pending invites for this email
  FOR invite_record IN
    SELECT id, workshop_id, role FROM public.workshop_invites
    WHERE lower(email) = lower(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > now()
  LOOP
    has_invite := true;
    INSERT INTO public.workshop_members (workshop_id, user_id, role)
    VALUES (invite_record.workshop_id, NEW.id, invite_record.role)
    ON CONFLICT DO NOTHING;
    UPDATE public.workshop_invites SET accepted_at = now() WHERE id = invite_record.id;
  END LOOP;

  -- If no invite, create their own workshop
  IF NOT has_invite THEN
    ws_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'workshop_name', ''), 'Minha Oficina');
    INSERT INTO public.workshops (name, whatsapp, email)
    VALUES (ws_name, NEW.raw_user_meta_data->>'whatsapp', NEW.email)
    RETURNING id INTO new_workshop_id;

    INSERT INTO public.workshop_members (workshop_id, user_id, role)
    VALUES (new_workshop_id, NEW.id, 'dono');
  END IF;

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
