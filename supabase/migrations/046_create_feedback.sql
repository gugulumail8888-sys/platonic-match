CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page text NOT NULL DEFAULT 'lp',
  created_at timestamptz DEFAULT now(),
  is_confirmed boolean NOT NULL DEFAULT false
);
