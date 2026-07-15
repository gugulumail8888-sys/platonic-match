-- 通報機能用のテーブルを新規作成
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_id uuid REFERENCES matchings(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL,
  reported_id uuid,
  reported_nickname text,
  category text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
