-- siblingsを3つのカラムに分割
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS siblings_exist TEXT,
  ADD COLUMN IF NOT EXISTS siblings_detail TEXT,
  ADD COLUMN IF NOT EXISTS siblings_position TEXT;
