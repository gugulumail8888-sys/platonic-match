-- =====================================================
-- Supabase 内部ユーザーのパスワード修正
-- supabase/postgres イメージの初期化後に実行
-- POSTGRES_PASSWORD に合わせて内部ユーザーを設定
-- =====================================================

-- GoTrue 用管理ユーザー
ALTER USER supabase_auth_admin WITH PASSWORD 'your-super-secret-and-long-postgres-password';

-- PostgREST 用接続ユーザー
ALTER USER authenticator WITH PASSWORD 'your-super-secret-and-long-postgres-password';

-- pgbouncer
ALTER USER pgbouncer WITH PASSWORD 'your-super-secret-and-long-postgres-password';

-- 確認
SELECT rolname, rolcanlogin FROM pg_roles
WHERE rolname IN ('supabase_auth_admin', 'authenticator', 'pgbouncer', 'supabase_admin')
ORDER BY rolname;
