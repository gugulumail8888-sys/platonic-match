-- お見合い開始から60分経過した日程調整済み(scheduling)マッチングを自動的にzoom_completedへ更新するpg_cronジョブ
-- pg_cron拡張は有効化済みであることを前提とする

-- 同名の既存ジョブがあれば一旦解除してから登録（重複防止・冪等化）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-zoom-completed') THEN
    PERFORM cron.unschedule('auto-zoom-completed');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-zoom-completed',
  '5 * * * *',
  $$
  UPDATE matchings
  SET status = 'zoom_completed'
  WHERE status = 'scheduling'
    AND scheduled_at IS NOT NULL
    AND scheduled_at + interval '60 minutes' < now();
  $$
);
