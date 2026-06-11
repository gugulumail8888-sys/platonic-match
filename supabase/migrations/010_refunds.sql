-- お見合い料返金管理テーブル
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.matchings(id) ON DELETE CASCADE,
  refund_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cancelled_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_refund_id TEXT,
  amount INTEGER NOT NULL DEFAULT 3000,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- 管理者のみ全件参照・操作可能
CREATE POLICY "admin_all" ON public.refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 本人は自分の返金情報のみ参照可能
CREATE POLICY "user_select_own" ON public.refunds
  FOR SELECT USING (refund_to_user_id = auth.uid());
