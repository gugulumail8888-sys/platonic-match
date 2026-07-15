-- 335日(11ヶ月)以上未ログインの会員へ、資格取消し30日前の通知メールを送るpg_cronジョブ
-- /api/cron/reminder (type: dormant_notice_batch) を毎日1回呼び出す

-- 同名の既存ジョブがあれば一旦解除してから登録(重複防止・冪等化)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dormant-notice-batch') THEN
    PERFORM cron.unschedule('dormant-notice-batch');
  END IF;
END $$;

SELECT cron.schedule(
  'dormant-notice-batch',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/reminder',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','dormant_notice_batch')
  );
  $$
);
