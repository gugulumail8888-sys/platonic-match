CREATE TABLE IF NOT EXISTS public.blocks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_email     TEXT NOT NULL,
  blocked_member_id INTEGER NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(blocker_email, blocked_member_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_email     ON public.blocks(blocker_email);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_member_id ON public.blocks(blocked_member_id);
