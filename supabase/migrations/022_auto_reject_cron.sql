-- 期限切れのお見合い申請(pending)を自動的にrejectedへ更新するpg_cronジョブ
-- pg_cron拡張は有効化済みであることを前提とする

-- 同名の既存ジョブがあれば一旦解除してから登録（重複防止・冪等化）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-reject-expired-matchings') THEN
    PERFORM cron.unschedule('auto-reject-expired-matchings');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-reject-expired-matchings',
  '0 * * * *',
  $$
  UPDATE matchings
  SET status = 'rejected', responded_at = now()
  WHERE status = 'pending' AND expires_at < now();
  $$
);
