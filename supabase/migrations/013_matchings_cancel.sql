-- matchingsテーブルにキャンセル関連カラムを追加
ALTER TABLE matchings
  ADD COLUMN IF NOT EXISTS amount integer,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancel_detail text;

-- statusにcancelledを追加
ALTER TABLE matchings
  DROP CONSTRAINT IF EXISTS matchings_status_check;

ALTER TABLE matchings
  ADD CONSTRAINT matchings_status_check
  CHECK (status IN ('pending', 'scheduling', 'completed', 'zoom_completed', 'cancelled'));
