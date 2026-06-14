-- 成功カップル統計テーブル
CREATE TABLE IF NOT EXISTS public.success_couples (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_b_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matching_id           UUID REFERENCES public.matchings(id) ON DELETE SET NULL,
  -- 両者のプロフィールスナップショット（統計用）
  age_difference        INTEGER,
  same_prefecture       BOOLEAN,
  marriage_timing_match BOOLEAN,
  children_desire_match BOOLEAN,
  external_partner_match BOOLEAN,
  post_marriage_living_match BOOLEAN,
  finance_management_match BOOLEAN,
  smoking_match         BOOLEAN,
  alcohol_match         BOOLEAN,
  hobbies_similarity    INTEGER, -- 0-100
  -- 結果
  result                TEXT CHECK (result IN ('married', 'dating', 'friendship', 'other')),
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 聞き取りフォームの回答テーブル
CREATE TABLE IF NOT EXISTS public.ai_preferences (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_age_min     INTEGER,
  preferred_age_max     INTEGER,
  preferred_prefecture  TEXT, -- 'near'=近い・'anywhere'=どこでもOK
  must_conditions       TEXT[], -- 絶対に譲れない条件
  priority_points       TEXT[], -- 重視するポイント（順番あり）
  free_message          TEXT,
  updated_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);
