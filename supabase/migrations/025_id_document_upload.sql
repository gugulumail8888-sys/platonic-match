-- 本人確認書類アップロード機能用
-- profilesに書類URLカラムを追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_back_url TEXT;

-- 本人確認書類用のプライベートStorageバケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
