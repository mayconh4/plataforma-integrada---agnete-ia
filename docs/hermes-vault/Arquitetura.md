---
title: Arquitetura
tags: [hermes, arquitetura]
created: 2026-06-23
---

# 🏗️ Arquitetura

```
App (React Native / Expo SDK 56)
  ├─ Login por senha (Supabase Auth)
  ├─ Envia mensagem → invoca a Edge Function "hermes"
  ├─ Realtime: ouve messages/tasks/automations/settings → atualiza a tela na hora
  └─ Push token registrado em push_tokens (após login)

Supabase
  ├─ Postgres + RLS (dados isolados por usuário via auth.uid())
  ├─ Realtime (websocket)
  ├─ Edge Function "hermes"     → OpenRouter (IA) + tool-calling → age no banco
  └─ Edge Function "scheduler"  → pg_cron (1/min) → automações no horário,
                                   tarefas adiadas vencidas → mensagem + push (Expo)
```

## Fluxo de uma mensagem
1. App insere/!invoca → `hermes` grava a mensagem do usuário.
2. `hermes` carrega contexto (tarefas, automações, histórico) e chama a IA.
3. A IA pode chamar ferramentas (criar tarefa, etc.) ou `present_options` (botões).
4. `hermes` grava a resposta (com `buttons` quando houver).
5. O **Realtime** entrega as novas linhas ao app → UI atualiza.

## Relacionadas
- [[Backend - Supabase]] · [[Edge Function - hermes]] · [[Edge Function - scheduler]] · [[App - Estrutura]]
