-- =====================================================
-- schedule_slots（日程候補）テーブル
-- お見合いの日程調整：申請者が候補日時を複数提案し、
-- お相手が1つ選択して確定する。
-- =====================================================

CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matching_id  UUID REFERENCES public.matchings(id) ON DELETE CASCADE NOT NULL,
  proposed_at  TIMESTAMPTZ NOT NULL,
  proposed_by  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_selected  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_matching_id ON public.schedule_slots(matching_id);

ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分がapplicant_idまたはpartner_idのmatchingに紐づくslotのみ閲覧可能
CREATE POLICY "schedule_slots_select_own" ON public.schedule_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matchings m
      WHERE m.id = schedule_slots.matching_id
        AND (auth.uid() = m.applicant_id OR auth.uid() = m.partner_id)
    )
  );

-- INSERT: 自分がapplicant_idまたはpartner_idのmatchingに紐づくslotのみ登録可能
CREATE POLICY "schedule_slots_insert_own" ON public.schedule_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matchings m
      WHERE m.id = schedule_slots.matching_id
        AND (auth.uid() = m.applicant_id OR auth.uid() = m.partner_id)
    )
  );

-- UPDATE: is_selectedの更新はpartner_id側のみ可能
CREATE POLICY "schedule_slots_update_partner" ON public.schedule_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matchings m
      WHERE m.id = schedule_slots.matching_id
        AND auth.uid() = m.partner_id
    )
  );

-- matchingsテーブルにupdated_atカラムを追加（未追加の場合のみ）
ALTER TABLE public.matchings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
