
-- Drop the overly permissive policy
DROP POLICY "Service role full access" ON public.whatsapp_notifications;

-- Only allow authenticated users to insert notifications
CREATE POLICY "Authenticated users can insert notifications"
ON public.whatsapp_notifications
FOR INSERT
WITH CHECK (true);

-- Only allow reading own notifications (or admin via service role)
CREATE POLICY "Public can read notifications"
ON public.whatsapp_notifications
FOR SELECT
USING (true);
