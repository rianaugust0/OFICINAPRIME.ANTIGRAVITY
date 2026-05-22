CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop_plate
  ON public.vehicles (workshop_id, plate);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate_trgm
  ON public.vehicles USING gin (plate gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_orders_vehicle_entry
  ON public.orders (vehicle_id, entry_date DESC);
