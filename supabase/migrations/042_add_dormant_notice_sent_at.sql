ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dormant_notice_sent_at timestamptz;
