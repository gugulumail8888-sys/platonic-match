-- =====================================================
-- 退会機能
-- profiles に withdrawn_at を追加し、status に
-- 'withdrawn' を許可する
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN withdrawn_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_status_check,
  ADD CONSTRAINT profiles_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text]));
