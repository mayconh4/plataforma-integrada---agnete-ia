---
title: Edge Function — scheduler
tags: [hermes, edge-function, cron, push]
created: 2026-06-23
arquivo: supabase/functions/scheduler/index.ts
---

# 📅 Edge Function — `scheduler`

Roda **a cada minuto** (via `pg_cron` + `pg_net`), mesmo com o app fechado.

## O que faz
1. Dispara **automações** cujo horário chegou (timezone `America/Sao_Paulo`).
2. Reativa **tarefas adiadas** cujo `defer_until` passou → voltam a `pending`.
3. Em ambos: grava mensagem do Hermes + envia **push** (Expo Push API).

## Segurança
- Exige header `x-cron-secret` == secret `CRON_SECRET`.
- Usa `service_role` (escaneia todos os usuários) — por isso só o cron a chama.

## Setup resumido
```bash
supabase functions deploy scheduler
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
# depois rode supabase/scheduler_cron.sql (troque PROJECT_REF e CRON_SECRET)
```

> [!note] Push no Android exige **FCM** + dev build/APK (não funciona no Expo Go).

## Relacionadas
- [[Backend - Supabase]] · [[Setup - Passo a Passo]] · [[Próximos Passos]]
