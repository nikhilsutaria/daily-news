-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Schedule: run the news pipeline once per day at 8:00 AM UTC
-- IMPORTANT: Replace <YOUR_PROJECT_REF> and <YOUR_TRIGGER_SECRET> with actual values before running
select cron.schedule(
  'run-news-pipeline',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/run-pipeline',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_TRIGGER_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
