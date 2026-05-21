INSERT INTO storage.buckets (id, name, public)
VALUES ('case-attachments', 'case-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users view own attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users update own attachment files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own attachment files" ON storage.objects;

CREATE POLICY "Users view own attachment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users upload own attachment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own attachment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'case-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own attachment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users update own attachments" ON public.case_attachments;

CREATE POLICY "Users update own attachments"
ON public.case_attachments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);