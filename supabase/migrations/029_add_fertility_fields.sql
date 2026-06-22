-- 妊活方法・性交渉の有無カラム追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fertility_methods TEXT[],
  ADD COLUMN IF NOT EXISTS sexual_activity   TEXT;
