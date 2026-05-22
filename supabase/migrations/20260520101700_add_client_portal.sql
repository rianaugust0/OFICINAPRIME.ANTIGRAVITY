-- Adicionar novos status ao ENUM order_status
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'recebido';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'em_analise';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'em_manutencao';

-- Adicionar is_approved na tabela orders
ALTER TABLE public.orders ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

-- Criar tabela client_portal_tokens
CREATE TABLE public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_portal_tokens_client ON public.client_portal_tokens(client_id);
CREATE INDEX idx_client_portal_tokens_token ON public.client_portal_tokens(token);

-- RLS para client_portal_tokens
ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage tokens" ON public.client_portal_tokens FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND public.is_workshop_member(auth.uid(), c.workshop_id))
);

-- RPC para buscar os dados do portal de forma segura (Acesso anônimo via token)
CREATE OR REPLACE FUNCTION public.get_portal_data(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id uuid;
    v_workshop_id uuid;
    v_result json;
BEGIN
    -- Verifica o token
    SELECT client_id INTO v_client_id FROM public.client_portal_tokens 
    WHERE token = p_token AND (expires_at IS NULL OR expires_at > now());
    
    IF v_client_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Pega o workshop_id para buscar os dados da oficina
    SELECT workshop_id INTO v_workshop_id FROM public.clients WHERE id = v_client_id;

    -- Monta o payload completo
    SELECT json_build_object(
        'workshop', (SELECT row_to_json(w) FROM (SELECT name, whatsapp, logo_url FROM public.workshops WHERE id = v_workshop_id) w),
        'client', (SELECT row_to_json(c) FROM (SELECT id, name, phone FROM public.clients WHERE id = v_client_id) c),
        'vehicles', (SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM (SELECT id, brand, model, plate FROM public.vehicles WHERE client_id = v_client_id) v),
        'orders', (SELECT COALESCE(json_agg(row_to_json(o)), '[]'::json) FROM (
            SELECT id, number, status, amount, is_approved, reported_problem, service_done, entry_date, expected_delivery, vehicle_id, items
            FROM public.orders 
            WHERE client_id = v_client_id 
            ORDER BY created_at DESC
        ) o)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- RPC para aprovar ordem de serviço pelo portal
CREATE OR REPLACE FUNCTION public.approve_portal_order(p_token text, p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id uuid;
BEGIN
    -- Verifica o token
    SELECT client_id INTO v_client_id FROM public.client_portal_tokens 
    WHERE token = p_token AND (expires_at IS NULL OR expires_at > now());
    
    IF v_client_id IS NULL THEN
        RETURN false;
    END IF;

    -- Atualiza a ordem
    UPDATE public.orders 
    SET is_approved = true, status = 'em_manutencao' 
    WHERE id = p_order_id AND client_id = v_client_id;
    
    RETURN FOUND;
END;
$$;
