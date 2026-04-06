
-- Add tenant_id to system_settings
ALTER TABLE public.system_settings ADD COLUMN tenant_id uuid;

-- Add tenant_id to payment_types  
ALTER TABLE public.payment_types ADD COLUMN tenant_id uuid;

-- Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_email text NOT NULL,
  plan text NOT NULL DEFAULT 'basico',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Auth can insert tenants" ON public.tenants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update tenants" ON public.tenants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete tenants" ON public.tenants FOR DELETE TO authenticated USING (true);

-- Link system_settings to tenants via FK
ALTER TABLE public.system_settings ADD CONSTRAINT fk_system_settings_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payment_types ADD CONSTRAINT fk_payment_types_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create a default tenant and link existing data
DO $$
DECLARE
  tid uuid;
BEGIN
  INSERT INTO public.tenants (name, owner_email, plan, active) 
  VALUES ('Rayssa Leslie Estética & Saúde da Mulher', 'admin@123.com', 'premium', true)
  RETURNING id INTO tid;
  
  UPDATE public.system_settings SET tenant_id = tid;
  UPDATE public.payment_types SET tenant_id = tid;
END $$;
