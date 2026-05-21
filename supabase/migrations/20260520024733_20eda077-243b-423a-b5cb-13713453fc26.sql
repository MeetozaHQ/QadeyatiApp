
-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT,
  title TEXT NOT NULL,
  case_type TEXT,
  court_name TEXT,
  circuit_name TEXT,
  client_name TEXT,
  opponent_name TEXT,
  status TEXT NOT NULL DEFAULT 'جديدة',
  description TEXT,
  first_session_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_archived ON public.cases(archived_at);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  session_type TEXT,
  court_name TEXT,
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_case_id ON public.sessions(case_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_date ON public.sessions(session_date DESC);

-- Notes table
CREATE TABLE public.case_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_case_id ON public.case_notes(case_id);

-- Attachments table
CREATE TABLE public.case_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_case_id ON public.case_attachments(case_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.case_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: cases
CREATE POLICY "Users view own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cases" ON public.cases FOR DELETE USING (auth.uid() = user_id);

-- RLS: sessions
CREATE POLICY "Users view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS: notes
CREATE POLICY "Users view own notes" ON public.case_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.case_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.case_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.case_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS: attachments
CREATE POLICY "Users view own attachments" ON public.case_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attachments" ON public.case_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own attachments" ON public.case_attachments FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for attachments (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('case-attachments', 'case-attachments', false);

CREATE POLICY "Users view own attachment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own attachment files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'case-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own attachment files"
ON storage.objects FOR DELETE
USING (bucket_id = 'case-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
