-- タスク#123: 「交際希望を伝える」ボタンを押した人が申請者(applicant)かお相手(partner)かで
-- 書き込み先カラムを分けるようアプリ側を修正したが、058で列レベル権限を絞った際に
-- applicant_dating_wish・dating_wish_atの2列しかUPDATE権限が付与されておらず、
-- partner_dating_wishはauthenticatedロールから書き込めない状態だった。
-- (058時点ではpartner側のバグにより実際にはこの列への書き込みが一度も発生していなかったため
--  気づかれていなかった)
-- partner_dating_wishもUPDATE対象に追加する(2026/7/21)。
GRANT UPDATE (applicant_dating_wish, partner_dating_wish, dating_wish_at) ON public.matchings TO authenticated;
