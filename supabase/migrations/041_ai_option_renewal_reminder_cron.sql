-- AIおすすめオプションの請求期間終了7日前にリマインドメールを送るpg_cronジョブ
-- /api/cron/reminder (type: ai_option_renewal_reminder) を毎日1回呼び出す

-- 同名の既存ジョブがあれば一旦解除してから登録(重複防止・冪等化)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-option-renewal-reminder') THEN
    PERFORM cron.unschedule('ai-option-renewal-reminder');
  END IF;
END $$;

SELECT cron.schedule(
  'ai-option-renewal-reminder',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/reminder',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','ai_option_renewal_reminder')
  );
  $$
);
