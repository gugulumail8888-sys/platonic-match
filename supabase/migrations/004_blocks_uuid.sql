-- Add UUID-based blocker/blocked columns to blocks for in-app member blocking
-- (existing blocker_email/blocked_member_id columns remain for the external counts API)
ALTER TABLE public.blocks
  ADD COLUMN blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN blocked_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS blocks_blocker_id_blocked_id_key ON public.blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
