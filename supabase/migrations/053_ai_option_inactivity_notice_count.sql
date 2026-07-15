-- AIオプション未ログイン通知を最大3回まで送るための送信回数カウント列を追加(タスク#72対応)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_inactivity_notice_count INTEGER NOT NULL DEFAULT 0;
