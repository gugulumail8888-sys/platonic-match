-- 退会後1年で本人確認書類画像を削除、退会後3年でアカウント・登録情報を削除するpg_cronジョブ
-- /api/cron/data-retention (type: delete_documents / delete_withdrawn_accounts) を毎日1回呼び出す

-- 同名の既存ジョブがあれば一旦解除してから登録(重複防止・冪等化)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-documents') THEN
    PERFORM cron.unschedule('delete-expired-documents');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-withdrawn-accounts') THEN
    PERFORM cron.unschedule('delete-withdrawn-accounts');
  END IF;
END $$;

-- ①退会後1年:本人確認書類画像の削除
SELECT cron.schedule(
  'delete-expired-documents',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/data-retention',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','delete_documents')
  );
  $$
);

-- ②退会後3年:アカウント・登録情報の削除
SELECT cron.schedule(
  'delete-withdrawn-accounts',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/data-retention',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','delete_withdrawn_accounts')
  );
  $$
);
