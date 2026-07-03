-- profilesテーブルにプロフィール管理機能用カラムを追加
-- admin_notes: 管理者が記録する備考欄（目視確認メモ用）
-- profile_reviewed_at: 手動確認済みの日時（未確認はnull）

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS profile_reviewed_at TIMESTAMPTZ;
