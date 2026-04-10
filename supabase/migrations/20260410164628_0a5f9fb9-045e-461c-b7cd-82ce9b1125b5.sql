
-- Allow anon to insert video rooms
CREATE POLICY "Anon users can create video rooms"
ON public.video_rooms FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon to update video rooms (needed to change status)
CREATE POLICY "Anon users can update video rooms"
ON public.video_rooms FOR UPDATE TO anon
USING (true) WITH CHECK (true);
