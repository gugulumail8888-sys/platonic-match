CREATE OR REPLACE FUNCTION public.update_profile_alcohol(alcohol_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET alcohol = alcohol_value WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_profile_alcohol(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_profile_alcohol(text) TO authenticated;
