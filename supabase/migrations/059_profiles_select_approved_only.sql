-- profiles: 「承認済み会員は全プロフィールを読める」ポリシーがUSING(true)で無条件になっており、
-- 審査中・拒否状態の会員でも他の全会員のプロフィール全列を読み取れる状態だった。
-- 自分自身がapproved(承認済み・自動)またはverified(手動チェック済み)の場合のみ、
-- 他会員のプロフィールを読めるよう制限する(2026/7/15、セキュリティ点検#98より切り出し#101)。
DROP POLICY IF EXISTS "承認済み会員は全プロフィールを読める" ON public.profiles;

CREATE POLICY "承認済み会員は全プロフィールを読める"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id = auth.uid()
      AND me.status IN ('approved', 'verified')
  )
);
