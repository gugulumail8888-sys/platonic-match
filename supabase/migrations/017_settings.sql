-- サービス設定テーブル
CREATE TABLE IF NOT EXISTS public.settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 初期値
INSERT INTO public.settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('site_name', 'amista'),
  ('admin_email', 'gugulumail.8888@gmail.com'),
  ('light_plan_price', '1078'),
  ('matching_fee_normal', '3500'),
  ('matching_fee_premium', '3000')
ON CONFLICT (key) DO NOTHING;
