CREATE TABLE public.workshop_fiscal_config (
    workshop_id uuid PRIMARY KEY REFERENCES public.workshops(id) ON DELETE CASCADE,
    cnpj text,
    inscricao_estadual text,
    inscricao_municipal text,
    cep text,
    logradouro text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    estado text,
    codigo_municipio text,
    ambiente text DEFAULT 'homologacao',
    regime_tributario integer DEFAULT 1,
    certificado_base64 text,
    certificado_senha text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.workshop_fiscal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshops can view their own fiscal config" 
    ON public.workshop_fiscal_config FOR SELECT 
    USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

CREATE POLICY "Workshops can insert their own fiscal config" 
    ON public.workshop_fiscal_config FOR INSERT 
    WITH CHECK (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

CREATE POLICY "Workshops can update their own fiscal config" 
    ON public.workshop_fiscal_config FOR UPDATE 
    USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('nfe', 'nfse')),
    status text NOT NULL DEFAULT 'pendente',
    valor numeric(12,2) NOT NULL,
    numero_nota text,
    chave_acesso text,
    xml_url text,
    pdf_url text,
    mensagem_erro text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshops can view their invoices" 
    ON public.invoices FOR SELECT 
    USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

CREATE POLICY "Workshops can insert invoices" 
    ON public.invoices FOR INSERT 
    WITH CHECK (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

CREATE POLICY "Workshops can update invoices" 
    ON public.invoices FOR UPDATE 
    USING (workshop_id IN (SELECT workshop_id FROM public.workshop_members WHERE user_id = auth.uid()));

