-- 会員設定（審査モード・新規登録受付・いいね上限数）の初期値
INSERT INTO public.settings (key, value) VALUES
  ('review_mode', 'manual'),
  ('registration_open', 'true'),
  ('daily_like_limit', '0')
ON CONFLICT (key) DO NOTHING;
