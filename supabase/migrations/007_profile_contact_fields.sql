-- =====================================================
-- プロフィール 連絡先・氏名カラム追加
-- 会員登録フォーム（src/app/(auth)/register）が送信する
-- last_name / first_name / phone を受け持つカラムが
-- profiles に存在しなかったため追加する。
-- 管理者向けCSVエクスポート（氏名・電話番号）でも使用する。
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN last_name  TEXT,
  ADD COLUMN first_name TEXT,
  ADD COLUMN phone      TEXT;
