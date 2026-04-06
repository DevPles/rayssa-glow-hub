
-- Table to queue WhatsApp notifications
CREATE TABLE public.whatsapp_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'agendamento', -- 'agendamento' or 'compra'
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to manage all notifications
-- No public access needed since this is admin-only
CREATE POLICY "Service role full access" 
ON public.whatsapp_notifications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_notifications;
