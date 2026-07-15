-- 「不備メールを送る」の送信履歴を記録するテーブル(2026/7/15、タスク#103対応)。
-- これまで送信してもどこにも記録が残らず、誰に・いつ・なぜ送ったか確認できなかったため新設。
CREATE TABLE IF NOT EXISTS public.verification_deficiency_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_deficiency_notices_profile_id
  ON public.verification_deficiency_notices(profile_id);

ALTER TABLE public.verification_deficiency_notices ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能(is_admin()はmigration 061で作成済みのSECURITY DEFINER関数)。
-- 実際のアクセスは管理画面のAPIルート(service roleクライアント)経由のみのため、
-- ここでは念のための多層防御として設定する。
CREATE POLICY "管理者は不備通知履歴を読める"
ON public.verification_deficiency_notices
FOR SELECT
TO authenticated
USING ( public.is_admin() );
