-- お見合い開始15分後の自動キャンセル・50分後の強制終了を行うpg_cronジョブ
-- /api/cron/meeting-timeout を5分間隔で呼び出す

-- 同名の既存ジョブがあれば一旦解除してから登録（重複防止・冪等化）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meeting-timeout-cancel') THEN
    PERFORM cron.unschedule('meeting-timeout-cancel');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meeting-timeout-force-end') THEN
    PERFORM cron.unschedule('meeting-timeout-force-end');
  END IF;
END $$;

-- ① 15分後自動キャンセル
SELECT cron.schedule(
  'meeting-timeout-cancel',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/meeting-timeout',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','meeting_timeout_cancel')
  );
  $$
);

-- ② 50分後強制終了
SELECT cron.schedule(
  'meeting-timeout-force-end',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://amista.net/api/cron/meeting-timeout',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'authorization_secret')),
    body := jsonb_build_object('type','meeting_force_end')
  );
  $$
);
