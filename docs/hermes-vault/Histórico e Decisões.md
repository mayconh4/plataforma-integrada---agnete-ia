---
title: Histórico e Decisões
tags: [hermes, decisões, log]
created: 2026-06-23
---

# 🧭 Histórico e Decisões

Linha do tempo do que foi construído (branch `claude/affectionate-maxwell-y902t4`).

1. **Build do APK / Expo SDK 56** — alinhadas as dependências ao pinning oficial
   (worklets 0.8.3 obrigatório, reanimated 4.3.1, gesture-handler ~2.31.1,
   async-storage 2.2.0); criados `eas.json` e `android.package`.
2. **Hermes local (1ª versão)** — motor determinístico + persistência local
   (AsyncStorage). *Depois substituído pelo backend online.*
3. **Online estilo Telegram** — migrado para **Supabase** (Auth por senha,
   Postgres+RLS, Realtime) e **IA via OpenRouter** numa Edge Function.
4. **Push + automações agendadas** — função `scheduler` via `pg_cron`, push Expo,
   tabela `push_tokens`. (Decisão: "só realtime" primeiro, depois push.)
5. **Botões de múltipla escolha** — ferramenta `present_options` na IA.

## Decisões importantes
- Sem servidor próprio: tudo no Supabase (Edge Functions).
- Chaves sensíveis (OpenRouter, service_role, CRON_SECRET) ficam **no servidor**.
- Timezone das automações: `America/Sao_Paulo` (no `scheduler`).
- Login: **e-mail + senha** (sem confirmação de e-mail, para entrar na hora).

## Relacionadas
- [[Hermes - Visão Geral]] · [[Próximos Passos]]
