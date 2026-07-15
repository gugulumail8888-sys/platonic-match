-- AIおすすめヒアリングに希望年収(下限、単位:万円)を追加(タスク#69対応)
ALTER TABLE ai_preferences
  ADD COLUMN IF NOT EXISTS preferred_income_min INTEGER;
