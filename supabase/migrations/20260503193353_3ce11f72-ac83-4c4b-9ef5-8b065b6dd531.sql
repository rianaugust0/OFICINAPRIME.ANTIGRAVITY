
-- Bucket público para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-logos', 'workshop-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "logos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-logos');

-- Owner pode upload/update/delete em sua pasta {workshop_id}/...
CREATE POLICY "owner upload logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);

CREATE POLICY "owner update logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);

CREATE POLICY "owner delete logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workshop-logos'
  AND public.has_workshop_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'dono'::workshop_role)
);
