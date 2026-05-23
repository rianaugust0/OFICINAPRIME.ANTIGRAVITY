-- Migration: Phase 1 (Inventory and Vehicles expansion)

-- 1. Create Inventory Table
CREATE TABLE public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    brand TEXT,
    category TEXT,
    location TEXT,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    supplier_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_workshop ON public.inventory(workshop_id);

-- 2. Create Inventory Transactions Table
CREATE TABLE public.inventory_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    notes TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_transactions_inventory ON public.inventory_transactions(inventory_id);

-- 3. Add new fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN renavam TEXT,
ADD COLUMN chassi TEXT,
ADD COLUMN engine TEXT,
ADD COLUMN fuel_type TEXT;

-- 4. Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "Users can view their workshop inventory"
ON public.inventory FOR SELECT
USING (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their workshop inventory"
ON public.inventory FOR INSERT
WITH CHECK (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their workshop inventory"
ON public.inventory FOR UPDATE
USING (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their workshop inventory"
ON public.inventory FOR DELETE
USING (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their workshop inventory transactions"
ON public.inventory_transactions FOR SELECT
USING (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their workshop inventory transactions"
ON public.inventory_transactions FOR INSERT
WITH CHECK (workshop_id IN (SELECT workshop_id FROM public.users_profiles WHERE user_id = auth.uid()));
