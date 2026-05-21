
CREATE TABLE public.lawyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  title text,
  bar_level text,
  office_name text,
  office_address text,
  whatsapp text,
  maps_link text,
  bio text,
  specializations text[] DEFAULT '{}',
  years_experience int,
  avatar_url text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view lawyer profiles"
  ON public.lawyer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users insert own profile"
  ON public.lawyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.lawyer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own profile"
  ON public.lawyer_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER lawyer_profiles_updated_at
  BEFORE UPDATE ON public.lawyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
