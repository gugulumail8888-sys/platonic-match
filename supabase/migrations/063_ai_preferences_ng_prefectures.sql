-- ai_preferencesにNG条件・希望都道府県(複数選択)を追加する(2026/7/15、タスク#104対応)。
-- 既存のpreferred_prefecture(近い/どこでもOKの2択)は/recommend画面のUIからは
-- 使わなくなるが、データ保全のため列自体は残す。
ALTER TABLE public.ai_preferences ADD COLUMN IF NOT EXISTS ng_conditions TEXT[];
ALTER TABLE public.ai_preferences ADD COLUMN IF NOT EXISTS preferred_prefectures TEXT[];
