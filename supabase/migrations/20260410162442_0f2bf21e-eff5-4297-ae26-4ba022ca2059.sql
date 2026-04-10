
-- Allow authenticated users to insert video rooms
CREATE POLICY "Authenticated users can create video rooms"
ON public.video_rooms FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read video rooms
CREATE POLICY "Authenticated users can read video rooms"
ON public.video_rooms FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to update video rooms
CREATE POLICY "Authenticated users can update video rooms"
ON public.video_rooms FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

-- Allow authenticated users to insert video signals
CREATE POLICY "Authenticated users can create video signals"
ON public.video_signals FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read video signals
CREATE POLICY "Authenticated users can read video signals"
ON public.video_signals FOR SELECT TO authenticated
USING (true);

-- Allow anon users to read video rooms (for patient access via link)
CREATE POLICY "Anon users can read video rooms"
ON public.video_rooms FOR SELECT TO anon
USING (true);

-- Allow anon users to read and insert video signals (for patient access)
CREATE POLICY "Anon users can read video signals"
ON public.video_signals FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon users can create video signals"
ON public.video_signals FOR INSERT TO anon
WITH CHECK (true);
