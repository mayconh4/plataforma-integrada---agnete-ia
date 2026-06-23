-- ============================================================================
-- Hermes — schema inicial (online, multiusuário, com RLS)
-- ============================================================================
-- Execute no SQL Editor do Supabase (ou via `supabase db push`).
-- Tudo é isolado por usuário via Row Level Security (auth.uid()).

-- Extensão para gen_random_uuid() (já vem no Supabase, mas garantimos).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tabelas
-- ----------------------------------------------------------------------------

create table if not exists public.settings (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  voice_enabled   boolean not null default true,
  preferred_model text    not null default 'claude',
  updated_at      timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  priority    text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  status      text not null default 'pending' check (status in ('pending','done','deferred','cancelled')),
  defer_until timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks (user_id, status);

create table if not exists public.automations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  trigger    text not null,
  enabled    boolean not null default true,
  runs       integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists automations_user_idx on public.automations (user_id);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('user','hermes')),
  text        text not null,
  buttons     jsonb,
  suggestions jsonb,
  narrate     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists messages_user_idx on public.messages (user_id, created_at);

-- ----------------------------------------------------------------------------
-- Row Level Security: cada usuário só acessa as próprias linhas
-- ----------------------------------------------------------------------------

alter table public.settings    enable row level security;
alter table public.tasks       enable row level security;
alter table public.automations enable row level security;
alter table public.messages    enable row level security;

-- replica identity full => eventos de realtime (update/delete) carregam a linha
alter table public.tasks       replica identity full;
alter table public.automations replica identity full;
alter table public.messages    replica identity full;
alter table public.settings    replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['settings','tasks','automations','messages'] loop
    execute format('drop policy if exists "owner_select" on public.%I;', t);
    execute format('drop policy if exists "owner_insert" on public.%I;', t);
    execute format('drop policy if exists "owner_update" on public.%I;', t);
    execute format('drop policy if exists "owner_delete" on public.%I;', t);

    execute format($f$create policy "owner_select" on public.%I for select using (user_id = auth.uid());$f$, t);
    execute format($f$create policy "owner_insert" on public.%I for insert with check (user_id = auth.uid());$f$, t);
    execute format($f$create policy "owner_update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());$f$, t);
    execute format($f$create policy "owner_delete" on public.%I for delete using (user_id = auth.uid());$f$, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Realtime: publica as tabelas para o canal supabase_realtime
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.automations;
alter publication supabase_realtime add table public.settings;

-- ----------------------------------------------------------------------------
-- Seed automático ao criar um novo usuário (settings + dados de exemplo)
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict do nothing;

  insert into public.automations (user_id, name, trigger, enabled) values
    (new.id, 'Sync CRM diário',  'Todo dia às 08:00',       true),
    (new.id, 'Backup noturno',   'Todo dia às 02:00',       true),
    (new.id, 'Resumo executivo', 'Sexta-feira às 18:00',    false);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
