
-- Create video_recordings table
CREATE TABLE public.video_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.video_rooms(id) ON DELETE SET NULL,
  clinical_record_id UUID REFERENCES public.clinical_records(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video_recordings"
ON public.video_recordings FOR SELECT TO public
USING (true);

CREATE POLICY "Anyone can insert video_recordings"
ON public.video_recordings FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update video_recordings"
ON public.video_recordings FOR UPDATE TO public
USING (true) WITH CHECK (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-recordings', 'video-recordings', true);

-- Storage policies
CREATE POLICY "Public read video recordings"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'video-recordings');

CREATE POLICY "Anyone can upload video recordings"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'video-recordings');
