
-- Tabela de assinaturas (tenants pagando plano SaaS)
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','cancelled','expired')),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix','boleto','credit_card','debit')),
  mp_subscription_id TEXT,
  mp_payer_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_day INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Auth can insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can update subscriptions" ON public.subscriptions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete subscriptions" ON public.subscriptions FOR DELETE USING (true);

-- Tabela de faturas (invoices geradas mensalmente)
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'subscription' CHECK (type IN ('subscription','service','product')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled','refunded')),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_external_reference TEXT,
  description TEXT,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Auth can insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can update invoices" ON public.invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete invoices" ON public.invoices FOR DELETE USING (true);

-- Tabela de transações/pagamentos (log detalhado)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'incoming' CHECK (type IN ('incoming','refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','in_process','refunded')),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT,
  mp_payment_id TEXT,
  mp_status TEXT,
  mp_status_detail TEXT,
  payer_email TEXT,
  payer_name TEXT,
  payer_document TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Auth can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can update payments" ON public.payments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete payments" ON public.payments FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
