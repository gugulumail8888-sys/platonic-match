-- 相互いいね自動マッチングトリガーを削除
DROP TRIGGER IF EXISTS trigger_create_match ON public.likes;
DROP FUNCTION IF EXISTS public.create_match_on_mutual_like();

-- likesテーブルに有効期限カラム追加
ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 既存データに3ヶ月の有効期限を設定
UPDATE public.likes SET expires_at = created_at + INTERVAL '3 months';

-- 新規いいねのデフォルト有効期限を3ヶ月に設定
ALTER TABLE public.likes
  ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '3 months');

-- 相互いいね時に有効期限をさらに3ヶ月延長する関数
CREATE OR REPLACE FUNCTION public.extend_mutual_like_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- 逆方向のいいねが存在する場合、両方の有効期限を延長
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE sender_id = NEW.receiver_id
    AND receiver_id = NEW.sender_id
  ) THEN
    -- 相手のいいねの有効期限を延長
    UPDATE public.likes
    SET expires_at = NOW() + INTERVAL '3 months'
    WHERE sender_id = NEW.receiver_id
    AND receiver_id = NEW.sender_id;

    -- 自分のいいねの有効期限も延長
    NEW.expires_at := NOW() + INTERVAL '3 months';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER extend_mutual_like_expiry
  BEFORE INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.extend_mutual_like_expiry();
