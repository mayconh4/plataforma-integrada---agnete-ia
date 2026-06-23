---
title: Backend — Supabase
tags: [hermes, supabase, banco, rls]
created: 2026-06-23
---

# 🗄️ Backend — Supabase

## Tabelas (todas com RLS por usuário — `user_id = auth.uid()`)
| Tabela | Para quê |
|---|---|
| `settings` | voz ligada/desligada, modelo preferido |
| `tasks` | tarefas (priority, status, defer_until) |
| `automations` | automações (schedule_hour/minute/days, last_run_at) |
| `messages` | conversa (role, text, **buttons** jsonb, suggestions, narrate) |
| `push_tokens` | tokens de push Expo por dispositivo |

## Migrations
- `supabase/migrations/0001_init.sql` — tabelas, RLS, Realtime, gatilho de seed.
- `supabase/migrations/0002_scheduling_push.sql` — push_tokens, agendamento
  estruturado, extensões `pg_cron`/`pg_net`.
- `supabase/scheduler_cron.sql` — agenda o `scheduler` (1/min) via pg_net.

## Pontos-chave
- **RLS** protege os dados; a `anon key` pode ir no app, a `service_role` **não**.
- **Realtime** publicado para messages/tasks/automations/settings.
- Gatilho `handle_new_user` popula dados de exemplo + boas-vindas no cadastro.

## Relacionadas
- [[Edge Function - hermes]] · [[Edge Function - scheduler]] · [[Setup - Passo a Passo]]
