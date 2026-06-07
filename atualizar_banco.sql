-- 1. Alterar a tabela ORDERS existente
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_condition text,
ADD COLUMN IF NOT EXISTS warranty_text text;

-- 2. Criar a tabela ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    item_type text NOT NULL,
    name text NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da oficina podem gerenciar itens de OS" ON public.order_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.workshop_members wm ON o.workshop_id = wm.workshop_id
            WHERE o.id = order_items.order_id AND wm.user_id = auth.uid()
        )
    );

-- 3. Criar a tabela QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id uuid REFERENCES public.workshops(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
    amount numeric DEFAULT 0,
    notes text,
    payment_method text,
    payment_condition text,
    warranty_text text,
    status text DEFAULT 'novo',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da oficina podem gerenciar orçamentos" ON public.quotes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workshop_members
            WHERE workshop_members.workshop_id = quotes.workshop_id
            AND workshop_members.user_id = auth.uid()
        )
    );

-- 4. Criar a tabela QUOTE_ITEMS
CREATE TABLE IF NOT EXISTS public.quote_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
    item_type text NOT NULL,
    name text NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da oficina podem gerenciar itens de orçamentos" ON public.quote_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            JOIN public.workshop_members wm ON q.workshop_id = wm.workshop_id
            WHERE q.id = quote_items.quote_id AND wm.user_id = auth.uid()
        )
    );

