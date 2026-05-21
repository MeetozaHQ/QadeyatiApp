
ALTER TABLE public.case_attachments
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'أخرى',
  ADD COLUMN IF NOT EXISTS file_size bigint;

CREATE INDEX IF NOT EXISTS idx_case_attachments_case ON public.case_attachments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_attachments_user_recent ON public.case_attachments(user_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS public.file_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  case_id uuid NOT NULL,
  attachment_id uuid,
  action text NOT NULL,
  file_name text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.file_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own file activity" ON public.file_activity
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own file activity" ON public.file_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own file activity" ON public.file_activity
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_file_activity_user_recent ON public.file_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_activity_case ON public.file_activity(case_id, created_at DESC);

ALTER TABLE public.case_attachments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
