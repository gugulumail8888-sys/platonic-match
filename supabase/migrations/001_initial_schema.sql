-- =====================================================
-- 婚活プラットフォーム 初期スキーマ
-- =====================================================

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nickname        TEXT NOT NULL,
  birth_date      DATE NOT NULL,
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  prefecture      TEXT NOT NULL,
  occupation      TEXT NOT NULL,
  annual_income   TEXT CHECK (annual_income IN (
    'under_200', '200_300', '300_400', '400_500',
    '500_700', '700_1000', 'over_1000'
  )),
  education       TEXT CHECK (education IN (
    'high_school', 'vocational', 'junior_college', 'university', 'graduate'
  )),
  height          INTEGER CHECK (height BETWEEN 140 AND 220),
  body_type       TEXT CHECK (body_type IN ('slim', 'normal', 'chubby', 'muscular', 'curvy')),
  alcohol         TEXT NOT NULL DEFAULT 'never' CHECK (alcohol IN ('never', 'sometimes', 'often', 'every_day')),
  smoking         TEXT NOT NULL DEFAULT 'never' CHECK (smoking IN ('never', 'sometimes', 'often', 'quit')),
  marriage_intention TEXT NOT NULL CHECK (marriage_intention IN (
    'soon', 'within_1_year', 'within_3_years', 'someday', 'undecided'
  )),
  about_me        TEXT,
  hobbies         TEXT[],
  avatar_url      TEXT,
  is_premium      BOOLEAN NOT NULL DEFAULT false,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  last_active_at  TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

-- マッチングテーブル
CREATE TABLE IF NOT EXISTS public.matches (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
  matched_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id   UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- インデックス
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_prefecture ON public.profiles(prefecture);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_likes_sender_id ON public.likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_receiver_id ON public.likes(receiver_id);

CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON public.matches(user2_id);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =====================================================
-- Row Level Security (RLS) ポリシー
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- プロフィール：全員閲覧可能、自分のみ更新可能
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- いいね：自分が絡むもののみ
CREATE POLICY "likes_select_own" ON public.likes
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "likes_insert_own" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "likes_delete_own" ON public.likes
  FOR DELETE USING (auth.uid() = sender_id);

-- マッチング：自分が絡むもののみ
CREATE POLICY "matches_select_own" ON public.matches
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- メッセージ：マッチした相手のみ
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = messages.match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
      AND status = 'active'
    )
  );

-- =====================================================
-- 自動マッチング トリガー
-- いいねが相互になったら自動でマッチング作成
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  v_match_exists BOOLEAN;
  v_user1_id UUID;
  v_user2_id UUID;
BEGIN
  -- 相互いいね確認
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE sender_id = NEW.receiver_id
    AND receiver_id = NEW.sender_id
  ) THEN
    -- ユーザーIDを並べ替えて一意のペアを作成
    IF NEW.sender_id < NEW.receiver_id THEN
      v_user1_id := NEW.sender_id;
      v_user2_id := NEW.receiver_id;
    ELSE
      v_user1_id := NEW.receiver_id;
      v_user2_id := NEW.sender_id;
    END IF;

    -- マッチングが存在しない場合のみ作成
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (v_user1_id, v_user2_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_match
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.create_match_on_mutual_like();

-- =====================================================
-- updated_at 自動更新トリガー
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
