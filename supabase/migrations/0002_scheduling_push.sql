-- ============================================================================
-- Hermes — etapa 2: push notifications + automações agendadas
-- ============================================================================
-- Execute APÓS a 0001_init.sql.

-- ----------------------------------------------------------------------------
-- Tokens de push (Expo) por usuário/dispositivo
-- ----------------------------------------------------------------------------

create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "owner_select" on public.push_tokens;
drop policy if exists "owner_insert" on public.push_tokens;
drop policy if exists "owner_update" on public.push_tokens;
drop policy if exists "owner_delete" on public.push_tokens;
create policy "owner_select" on public.push_tokens for select using (user_id = auth.uid());
create policy "owner_insert" on public.push_tokens for insert with check (user_id = auth.uid());
create policy "owner_update" on public.push_tokens for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner_delete" on public.push_tokens for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Agendamento estruturado das automações (horário em America/Sao_Paulo)
-- ----------------------------------------------------------------------------

alter table public.automations add column if not exists schedule_hour   integer;
alter table public.automations add column if not exists schedule_minute integer not null default 0;
-- dias da semana: 0=domingo .. 6=sábado. Vazio = todos os dias.
alter table public.automations add column if not exists schedule_days   integer[] not null default '{}';
alter table public.automations add column if not exists last_run_at     timestamptz;

-- Backfill dos exemplos já criados (best-effort por nome).
update public.automations set schedule_hour = 8,  schedule_minute = 0,  schedule_days = '{}'    where name = 'Sync CRM diário'  and schedule_hour is null;
update public.automations set schedule_hour = 2,  schedule_minute = 0,  schedule_days = '{}'    where name = 'Backup noturno'   and schedule_hour is null;
update public.automations set schedule_hour = 18, schedule_minute = 0,  schedule_days = '{5}'   where name = 'Resumo executivo' and schedule_hour is null;

-- ----------------------------------------------------------------------------
-- Recria o seed de novos usuários com horários estruturados
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict do nothing;

  insert into public.automations (user_id, name, trigger, enabled, schedule_hour, schedule_minute, schedule_days) values
    (new.id, 'Sync CRM diário',  'Todo dia às 08:00',    true,  8,  0, '{}'),
    (new.id, 'Backup noturno',   'Todo dia às 02:00',    true,  2,  0, '{}'),
    (new.id, 'Resumo executivo', 'Sexta-feira às 18:00', false, 18, 0, '{5}');

  insert into public.tasks (user_id, title, priority) values
    (new.id, 'Sincronizar dados do CRM', 'high'),
    (new.id, 'Atualizar agentes de IA',  'urgent');

  insert into public.messages (user_id, role, text, suggestions, narrate) values
    (new.id, 'hermes',
     'Olá! Sou o Hermes, seu assistente operacional. Posso gerenciar suas tarefas, automações e responder o que precisar. Como posso ajudar?',
     '["Ver minhas tarefas", "Status do sistema", "Criar uma tarefa"]'::jsonb,
     true);

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- Extensões para agendamento via cron (a chamada cron.schedule fica no
-- arquivo supabase/scheduler_cron.sql, pois inclui a URL e o segredo do projeto)
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;
