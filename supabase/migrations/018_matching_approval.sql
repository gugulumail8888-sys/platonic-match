-- matchingsテーブルにrejectedステータスを追加
ALTER TABLE matchings
  DROP CONSTRAINT IF EXISTS matchings_status_check;

ALTER TABLE matchings
  ADD CONSTRAINT matchings_status_check
  CHECK (status IN ('pending', 'scheduling', 'completed', 'zoom_completed', 'cancelled', 'rejected'));

-- 承認・拒否日時カラムを追加
ALTER TABLE matchings
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
