-- AIおすすめオプション契約者が1.5ヶ月(45日)以上未ログインの場合にお知らせメールを送るpg_cronジョブ(タスク#72)
-- /api/cron/reminder (type: ai_option_inactivity_notice) を毎日1回呼び出す

-- 同名の既存ジョブがあれば一旦解除してから登録(重複防止・冪等化)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-option-inactivity-notice') THEN
    PERFORM cron.unschedule('ai-option-inactivity-notice');
  END IF;
END $$;

SELECT cron.schedule(
  'ai-option-inactivity-notice',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/reminder',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','ai_option_inactivity_notice')
  );
  $$
);
