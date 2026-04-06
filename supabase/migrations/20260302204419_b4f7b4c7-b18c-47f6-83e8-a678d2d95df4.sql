
-- Allow authenticated users to insert system_settings (needed when creating new tenants)
CREATE POLICY "Authenticated can insert settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete system_settings
CREATE POLICY "Authenticated can delete settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (true);
