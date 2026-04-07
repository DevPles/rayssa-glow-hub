
-- 1. Clinical Records (main patient + gestational card)
CREATE TABLE public.clinical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  prontuario_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  marital_status TEXT,
  profession TEXT,
  emergency_contact TEXT,
  patient_photo TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  consent_signed BOOLEAN NOT NULL DEFAULT false,
  gestational_card JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read clinical_records" ON public.clinical_records FOR SELECT USING (true);
CREATE POLICY "Auth can insert clinical_records" ON public.clinical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update clinical_records" ON public.clinical_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete clinical_records" ON public.clinical_records FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_clinical_records_updated_at
  BEFORE UPDATE ON public.clinical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Prenatal Consultations
CREATE TABLE public.prenatal_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinical_record_id UUID NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada',
  gestational_age TEXT,
  weight NUMERIC,
  blood_pressure TEXT,
  uterine_height NUMERIC,
  fetal_heart_rate TEXT,
  fetal_presentation TEXT,
  edema TEXT,
  complaints TEXT,
  conduct TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prenatal_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prenatal_consultations" ON public.prenatal_consultations FOR SELECT USING (true);
CREATE POLICY "Auth can insert prenatal_consultations" ON public.prenatal_consultations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update prenatal_consultations" ON public.prenatal_consultations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete prenatal_consultations" ON public.prenatal_consultations FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_prenatal_consultations_updated_at
  BEFORE UPDATE ON public.prenatal_consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Gestational Exams
CREATE TABLE public.gestational_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinical_record_id UUID NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  trimester INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gestational_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gestational_exams" ON public.gestational_exams FOR SELECT USING (true);
CREATE POLICY "Auth can insert gestational_exams" ON public.gestational_exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update gestational_exams" ON public.gestational_exams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete gestational_exams" ON public.gestational_exams FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_gestational_exams_updated_at
  BEFORE UPDATE ON public.gestational_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Vaccines
CREATE TABLE public.vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinical_record_id UUID NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  dose TEXT,
  lot TEXT,
  status TEXT NOT NULL DEFAULT 'aplicada',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vaccines" ON public.vaccines FOR SELECT USING (true);
CREATE POLICY "Auth can insert vaccines" ON public.vaccines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update vaccines" ON public.vaccines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete vaccines" ON public.vaccines FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_vaccines_updated_at
  BEFORE UPDATE ON public.vaccines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
