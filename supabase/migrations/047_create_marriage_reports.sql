CREATE TABLE IF NOT EXISTS marriage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  met_timing text,
  trigger text,
  satisfaction integer,
  message text,
  created_at timestamptz DEFAULT now(),
  is_confirmed boolean NOT NULL DEFAULT false
);
