-- 延期(日程変更)の申請回数を記録する列を追加。原則1回までの制限に使用。
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS postponed_count integer NOT NULL DEFAULT 0;
