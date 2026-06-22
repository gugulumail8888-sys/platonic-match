-- =====================================================
-- ai_usage_logs（AIおすすめ機能の利用ログ）
-- 1日3回までの利用制限のためのカウント用テーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id_created_at
  ON public.ai_usage_logs(user_id, created_at);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分の利用ログのみ閲覧可能
CREATE POLICY "ai_usage_logs_select_own" ON public.ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: 自分の利用ログのみ登録可能
CREATE POLICY "ai_usage_logs_insert_own" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
