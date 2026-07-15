-- 059で作成したprofilesのSELECTポリシーが、ポリシー内でprofilesテーブル自身を
-- 参照しているため無限再帰(42P17)が発生する不具合を修正する(2026/7/15発見)。
-- SECURITY DEFINER関数を経由することで、関数内部のSELECTがRLSをバイパスし、
-- 再帰を回避する。

CREATE OR REPLACE FUNCTION public.is_approved_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT status IN ('approved', 'verified')
  FROM public.profiles
  WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "承認済み会員は全プロフィールを読める" ON public.profiles;

CREATE POLICY "承認済み会員は全プロフィールを読める"
ON public.profiles
FOR SELECT
TO authenticated
USING ( public.is_approved_member() );
