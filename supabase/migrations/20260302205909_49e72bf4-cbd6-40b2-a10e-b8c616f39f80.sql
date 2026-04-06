
-- Create plans table for custom plans managed by super admin
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  features text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Auth can insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update plans" ON public.plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete plans" ON public.plans FOR DELETE TO authenticated USING (true);

-- Add banking data columns to tenants
ALTER TABLE public.tenants
  ADD COLUMN pix_key text DEFAULT '',
  ADD COLUMN bank_name text DEFAULT '',
  ADD COLUMN bank_agency text DEFAULT '',
  ADD COLUMN bank_account text DEFAULT '',
  ADD COLUMN holder_name text DEFAULT '',
  ADD COLUMN holder_document text DEFAULT '';

-- Insert default plans
INSERT INTO public.plans (name, price_monthly, description, features) VALUES
  ('Básico', 99.90, 'Ideal para quem está começando', ARRAY['Agenda básica', 'Até 50 clientes', 'Relatórios simples']),
  ('Profissional', 199.90, 'Para clínicas em crescimento', ARRAY['Agenda completa', 'Clientes ilimitados', 'Relatórios avançados', 'Blog', 'Afiliados']),
  ('Premium', 399.90, 'Experiência completa', ARRAY['Tudo do Profissional', 'Suporte prioritário', 'Multi-usuários', 'API de integração', 'Personalização total']);
