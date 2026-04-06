
-- System settings table
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Rayssa Leslie Estética & Saúde da Mulher',
  company_short_name text NOT NULL DEFAULT 'Rayssa Leslie',
  company_subtitle text NOT NULL DEFAULT 'Estética & Saúde da Mulher',
  logo_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Payment types table
CREATE TABLE public.payment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.system_settings (company_name, company_short_name, company_subtitle) 
VALUES ('Rayssa Leslie Estética & Saúde da Mulher', 'Rayssa Leslie', 'Estética & Saúde da Mulher');

-- Insert default payment types
INSERT INTO public.payment_types (name) VALUES 
  ('Dinheiro'),
  ('PIX'),
  ('Cartão de Crédito'),
  ('Cartão de Débito');

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can read payment types" ON public.payment_types FOR SELECT USING (true);

-- Authenticated can update settings (admin check will be in app)
CREATE POLICY "Authenticated can update settings" ON public.system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert payment types" ON public.payment_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payment types" ON public.payment_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete payment types" ON public.payment_types FOR DELETE TO authenticated USING (true);
