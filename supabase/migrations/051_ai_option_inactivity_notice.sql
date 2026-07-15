-- AIおすすめオプション契約者向け1.5ヶ月未ログイン通知の送信済みフラグ(タスク#72対応)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_inactivity_notice_sent_at TIMESTAMPTZ;
