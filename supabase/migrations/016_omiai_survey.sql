-- お見合い後アンケートテーブル
CREATE TABLE IF NOT EXISTS public.omiai_surveys (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matching_id           UUID REFERENCES public.matchings(id) ON DELETE SET NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  omiai_satisfaction    INTEGER NOT NULL CHECK (omiai_satisfaction BETWEEN 1 AND 5),
  partner_impression    TEXT NOT NULL CHECK (partner_impression IN ('good', 'normal', 'bad')),
  want_to_meet_again    TEXT NOT NULL CHECK (want_to_meet_again IN ('yes', 'no', 'considering')),
  service_satisfaction  INTEGER NOT NULL CHECK (service_satisfaction BETWEEN 1 AND 5),
  comment               TEXT,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);
