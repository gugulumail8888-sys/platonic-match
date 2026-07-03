-- 会員の停止（アカウント凍結）機能用カラム追加
-- statusとは独立してアクセス制限を管理する
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;
