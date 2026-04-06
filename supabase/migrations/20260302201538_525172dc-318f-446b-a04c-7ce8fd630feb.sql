
-- Create storage bucket for system assets
INSERT INTO storage.buckets (id, name, public) VALUES ('system-assets', 'system-assets', true);

-- Allow public read access
CREATE POLICY "Public read system assets" ON storage.objects FOR SELECT USING (bucket_id = 'system-assets');

-- Allow authenticated users to upload/update/delete
CREATE POLICY "Auth upload system assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'system-assets');
CREATE POLICY "Auth update system assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'system-assets') WITH CHECK (bucket_id = 'system-assets');
CREATE POLICY "Auth delete system assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'system-assets');
