
-- Video rooms table
CREATE TABLE public.video_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video_rooms" ON public.video_rooms FOR SELECT USING (true);
CREATE POLICY "Auth can insert video_rooms" ON public.video_rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update video_rooms" ON public.video_rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete video_rooms" ON public.video_rooms FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_video_rooms_updated_at
  BEFORE UPDATE ON public.video_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Video signals table
CREATE TABLE public.video_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.video_rooms(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video_signals" ON public.video_signals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert video_signals" ON public.video_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete video_signals" ON public.video_signals FOR DELETE USING (true);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_rooms;
