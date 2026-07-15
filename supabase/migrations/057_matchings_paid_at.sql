-- 申請者側・お相手側それぞれの支払い完了日時を記録する列
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS partner_paid_at TIMESTAMPTZ;

-- 既存データのバックフィル（正確な支払い日時ではなく申請作成日での代用。今月分の売上がゼロにならないようにするための暫定措置）
UPDATE matchings SET paid_at = created_at WHERE payment_intent_id IS NOT NULL AND paid_at IS NULL;
UPDATE matchings SET partner_paid_at = created_at WHERE partner_payment_intent_id IS NOT NULL AND partner_paid_at IS NULL;
