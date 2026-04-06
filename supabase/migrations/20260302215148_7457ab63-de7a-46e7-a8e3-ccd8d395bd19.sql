
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Auth upload system assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update system assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete system assets" ON storage.objects;

-- Recreate with anon access for system-assets bucket
CREATE POLICY "Anyone can upload system assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'system-assets');

CREATE POLICY "Anyone can update system assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'system-assets')
WITH CHECK (bucket_id = 'system-assets');

CREATE POLICY "Anyone can delete system assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'system-assets');
