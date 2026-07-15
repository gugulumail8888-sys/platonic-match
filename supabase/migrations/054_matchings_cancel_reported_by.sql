-- キャンセル報告(/cancel-report)を実際に送信した会員を記録する列
ALTER TABLE matchings ADD COLUMN IF NOT EXISTS cancel_reported_by UUID REFERENCES auth.users(id);
