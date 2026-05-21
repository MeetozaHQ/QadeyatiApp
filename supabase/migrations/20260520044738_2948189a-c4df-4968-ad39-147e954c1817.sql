
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'غير مدفوع',
  notes TEXT,
  client_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'غير مدفوع',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own installments" ON public.payment_installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own installments" ON public.payment_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own installments" ON public.payment_installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own installments" ON public.payment_installments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_installments_payment ON public.payment_installments(payment_id);
