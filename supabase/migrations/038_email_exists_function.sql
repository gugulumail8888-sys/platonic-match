-- =====================================================
-- メールアドレスの重複確認用関数
-- サインアップ時に、指定したメールアドレスが既にauth.usersに
-- 存在するかどうかだけを安全に確認するために使用する
-- (パスワード等の機微情報は一切返さない)
-- =====================================================
CREATE OR REPLACE FUNCTION public.email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = check_email
  );
$$;

GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon, authenticated;
