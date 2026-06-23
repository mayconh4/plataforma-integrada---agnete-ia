-- ============================================================================
-- Agenda a função `scheduler` para rodar a cada minuto via pg_cron + pg_net.
-- ----------------------------------------------------------------------------
-- Rode no SQL Editor APÓS:
--   1. aplicar 0002_scheduling_push.sql
--   2. fazer deploy da função scheduler  (supabase functions deploy scheduler)
--   3. definir o secret CRON_SECRET       (supabase secrets set CRON_SECRET=...)
--
-- Substitua os DOIS placeholders abaixo:
--   <PROJECT_REF>  -> o ref do seu projeto (Project Settings → General)
--   <CRON_SECRET>  -> o MESMO valor que você passou em `supabase secrets set`
-- ============================================================================

-- Remove agendamento anterior (se existir) para poder reexecutar este script.
select cron.unschedule('hermes-scheduler')
where exists (select 1 from cron.job where jobname = 'hermes-scheduler');

select cron.schedule(
  'hermes-scheduler',
  '* * * * *',  -- a cada minuto
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 8000
  );
  $$
);

-- Para conferir / acompanhar:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
