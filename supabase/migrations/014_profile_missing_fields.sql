-- フリガナ・住所・飲酒カラム追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS furigana_last  TEXT,
  ADD COLUMN IF NOT EXISTS furigana_first TEXT,
  ADD COLUMN IF NOT EXISTS address        TEXT;
