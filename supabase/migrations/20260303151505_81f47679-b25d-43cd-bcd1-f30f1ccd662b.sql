
CREATE TABLE public.payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL DEFAULT 'mercadopago',
  access_token text,
  public_key text,
  webhook_secret text,
  sandbox_token text,
  is_sandbox boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  enable_pix boolean NOT NULL DEFAULT true,
  enable_card boolean NOT NULL DEFAULT true,
  enable_boleto boolean NOT NULL DEFAULT false,
  enable_installments boolean NOT NULL DEFAULT true,
  max_installments integer NOT NULL DEFAULT 12,
  enable_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payment_providers" ON public.payment_providers FOR SELECT USING (true);
CREATE POLICY "Auth can insert payment_providers" ON public.payment_providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can update payment_providers" ON public.payment_providers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete payment_providers" ON public.payment_providers FOR DELETE USING (true);
