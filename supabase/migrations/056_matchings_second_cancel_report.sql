-- 先に一方がキャンセル報告をした後、もう一方も自分の言い分を追加報告できるようにする列
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS second_cancel_reason TEXT;
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS second_cancel_detail TEXT;
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS second_cancel_reported_by UUID REFERENCES auth.users(id);
