INSERT INTO public.settings (key, value) VALUES
  ('maintenance_scheduled_start', ''),
  ('maintenance_scheduled_end', ''),
  ('maintenance_notice_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
