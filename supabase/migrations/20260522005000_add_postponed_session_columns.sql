ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS next_session_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_session_type text,
ADD COLUMN IF NOT EXISTS postponed_from_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL;
