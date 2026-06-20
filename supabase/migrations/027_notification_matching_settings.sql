-- 通知設定・マッチング設定・その他未登録キーの初期値
INSERT INTO public.settings (key, value) VALUES
  ('admin_notify_email',       'gugulumail.8888@gmail.com'),
  ('notify_new_member',        'true'),
  ('notify_matching_apply',    'true'),
  ('zoom_expiry_days',         '7'),
  ('matching_auto_cancel_days','7'),
  ('dating_wish_expiry_days',  '90'),
  ('ai_option_enabled',        'true'),
  ('campaign_banner_enabled',  'false')
ON CONFLICT (key) DO NOTHING;
