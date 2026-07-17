-- omiai-day-reminder cronジョブの実行間隔を1時間ごとから5分ごとに変更
-- (day_reminderの送信タイミングを「2〜3時間前」から「10〜15分前」に変更したことに伴う対応)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'omiai-day-reminder'),
  schedule := '*/5 * * * *'
);
