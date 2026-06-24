CREATE TABLE public.workshop_whatsapp_config (
    workshop_id uuid PRIMARY KEY REFERENCES public.workshops(id) ON DELETE CASCADE,
    instance_name text,
    status text DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'qrcode', 'connected')),
    qr_code_base64 text,
    last_connected_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.workshop_whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshops view own wpp" ON public.workshop_whatsapp_config FOR SELECT USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));
CREATE POLICY "Workshops insert own wpp" ON public.workshop_whatsapp_config FOR INSERT WITH CHECK (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));
CREATE POLICY "Workshops update own wpp" ON public.workshop_whatsapp_config FOR UPDATE USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));
