-- ログイン失敗回数をサーバー側で管理するテーブル(タスク#66対応)
-- メールアドレス単位で失敗回数とロック解除時刻を記録する

CREATE TABLE IF NOT EXISTS login_attempts (
  email text PRIMARY KEY,
  fail_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
