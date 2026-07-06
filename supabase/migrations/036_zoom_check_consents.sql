-- =====================================================
-- zoom_check_consents（お見合い中の注意事項 同意記録）テーブル
-- Google Meetお見合いに参加する各ユーザーが、注意事項に
-- 同意した日時を記録する。1つのmatchingにつきuser1・user2が
-- それぞれ個別に同意レコードを持つ。
-- =====================================================

CREATE TABLE IF NOT EXISTS public.zoom_check_consents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matching_id  UUID REFERENCES public.matchings(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agreed_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(matching_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_zoom_check_consents_matching_id ON public.zoom_check_consents(matching_id);

ALTER TABLE public.zoom_check_consents ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分がapplicant_idまたはpartner_idのmatchingに紐づく同意記録のみ閲覧可能
CREATE POLICY "zoom_check_consents_select_own" ON public.zoom_check_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matchings m
      WHERE m.id = zoom_check_consents.matching_id
        AND (auth.uid() = m.applicant_id OR auth.uid() = m.partner_id)
    )
  );

-- INSERT: 自分自身（user_id）かつ、自分がapplicant_idまたはpartner_idのmatchingに対してのみ登録可能
CREATE POLICY "zoom_check_consents_insert_own" ON public.zoom_check_consents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matchings m
      WHERE m.id = zoom_check_consents.matching_id
        AND (auth.uid() = m.applicant_id OR auth.uid() = m.partner_id)
    )
  );
