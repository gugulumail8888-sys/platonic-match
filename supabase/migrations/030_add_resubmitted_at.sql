ALTER TABLE profiles ADD COLUMN resubmitted_at TIMESTAMPTZ;
COMMENT ON COLUMN profiles.resubmitted_at IS '本人確認書類の再アップロード日時。管理者が手動チェック済みにするとNULLに戻る。';
