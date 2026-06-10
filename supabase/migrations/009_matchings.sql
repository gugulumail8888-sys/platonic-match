-- =====================================================
-- お見合い申請（matchings）テーブル
-- src/app/(main)/matching, src/app/admin/matching が
-- 参照しているが、これまでテーブル自体が未作成だったため追加する。
-- =====================================================

CREATE TABLE IF NOT EXISTS public.matchings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduling', 'completed', 'zoom_completed')),
  applicant_dating_wish BOOLEAN NOT NULL DEFAULT false,
  partner_dating_wish   BOOLEAN NOT NULL DEFAULT false,
  dating_wish_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matchings_applicant_id ON public.matchings(applicant_id);
CREATE INDEX IF NOT EXISTS idx_matchings_partner_id ON public.matchings(partner_id);

ALTER TABLE public.matchings ENABLE ROW LEVEL SECURITY;

-- お見合い：自分が申請者または相手のもののみ閲覧・更新可能
CREATE POLICY "matchings_select_own" ON public.matchings
  FOR SELECT USING (
    auth.uid() = applicant_id OR auth.uid() = partner_id
  );

CREATE POLICY "matchings_update_own" ON public.matchings
  FOR UPDATE USING (
    auth.uid() = applicant_id OR auth.uid() = partner_id
  );
