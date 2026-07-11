-- 通報・ご意見要望・アンケート(お見合い後/成婚報告)の確認済み管理用フラグを追加
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE omiai_surveys ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE marriage_reports ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false;
