-- profilesの「管理者は全プロフィールを読める」(SELECT)・「管理者は全プロフィールを更新できる」
-- (UPDATE)の2ポリシーが、authenticatedロールが直接アクセス権限を持たないauth.usersテーブルを
-- 直接参照しており、42501(permission denied for table users)エラーを起こす不具合を修正する
-- (2026/7/15発見。migration 059でSELECTポリシーを条件付きに変更したことで、
-- 従来は常に真だった別ポリシーの陰に隠れていたこの不具合が表面化した)。
-- SECURITY DEFINER関数を経由し、関数内部でauth.usersを読むことでRLSと権限チェックをバイパスする。

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (raw_user_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

DROP POLICY IF EXISTS "管理者は全プロフィールを読める" ON public.profiles;
CREATE POLICY "管理者は全プロフィールを読める"
ON public.profiles
FOR SELECT
TO authenticated
USING ( public.is_admin() );

DROP POLICY IF EXISTS "管理者は全プロフィールを更新できる" ON public.profiles;
CREATE POLICY "管理者は全プロフィールを更新できる"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );
