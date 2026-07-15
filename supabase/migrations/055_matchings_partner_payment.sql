-- お相手側のお見合い料支払いを記録する列(申請者側は既存のamount・payment_intent_id・refundedをそのまま使用)
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS partner_payment_intent_id TEXT;
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS partner_amount INTEGER;
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS partner_refunded BOOLEAN NOT NULL DEFAULT false;
