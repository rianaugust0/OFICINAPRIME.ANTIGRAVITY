ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS inventory_id uuid REFERENCES public.inventory(id);
