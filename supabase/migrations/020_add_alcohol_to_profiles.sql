-- alcoholカラム追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alcohol TEXT;
