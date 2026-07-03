-- matchingsテーブルにGoogle Meet入室トラッキング用カラムを追加
-- user1_joined_at: 申請者（applicant）側がGoogle Meetリンクをクリックした時刻
-- user2_joined_at: お相手（partner）側がGoogle Meetリンクをクリックした時刻
-- meeting_ended_at: 強制終了処理が実行された時刻（重複実行防止用）
ALTER TABLE matchings
  ADD COLUMN IF NOT EXISTS user1_joined_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user2_joined_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meeting_ended_at TIMESTAMPTZ DEFAULT NULL;

-- statusに'ended'（強制終了済み）を追加
-- 既存制約（009_matchings.sql→013_matchings_cancel.sql→018_matching_approval.sqlで更新）:
-- CHECK (status IN ('pending', 'scheduling', 'completed', 'zoom_completed', 'cancelled', 'rejected'))
ALTER TABLE matchings
  DROP CONSTRAINT IF EXISTS matchings_status_check;

ALTER TABLE matchings
  ADD CONSTRAINT matchings_status_check
  CHECK (status IN ('pending', 'scheduling', 'completed', 'zoom_completed', 'cancelled', 'rejected', 'ended'));
