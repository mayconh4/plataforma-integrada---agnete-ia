---
title: Backend — Supabase (banco)
tags: [continental, supabase, banco, rls]
created: 2026-06-23
updated: 2026-06-23
---

# 🗄️ Backend — Supabase (somente banco)

No Continental, o Supabase é **banco + auth** — o cérebro é o [[Backend - FastAPI (Hermes)]].

## Tabelas (RLS por usuário — `user_id = auth.uid()`)
| Tabela | Para quê |
|---|---|
| `settings` | voz ligada/desligada, modelo preferido |
| `messages` | conversa (role, text, **buttons** jsonb, narrate) |
| `tasks` / `automations` | latentes (uso futuro dos projetos) |

- Migration: `supabase/migrations/0001_init.sql` (tabelas, RLS, gatilho de seed).
- Login: e-mail + senha (desativar *Confirm email* para entrar na hora).
- `service_role key` → só no backend (PC). `anon key` → pode ir no app.

## Relacionadas
- [[Backend - FastAPI (Hermes)]] · [[Setup - Passo a Passo]]
