---
title: Histórico e Decisões
tags: [continental, decisões, log]
created: 2026-06-23
updated: 2026-06-23
---

# 🧭 Histórico e Decisões

Linha do tempo (branch `claude/affectionate-maxwell-y902t4`).

1. **Build do APK / Expo SDK 56** — dependências alinhadas ao pinning oficial.
2. **Hermes local (v1)** — motor determinístico + persistência local. *Substituído.*
3. **Online via Supabase** — Auth, Postgres+RLS, Realtime e IA via Edge Function
   (OpenRouter). *Substituído na recontextualização.*
4. **Push + automações agendadas** — Edge Function scheduler + push. *Removido (fora do núcleo).*
5. **🔄 RECONTEXTUALIZAÇÃO → CONTINENTAL** — o produto é o **Continental**: interface
   premium que conecta o Maycon ao **Hermes local** (substitui o Telegram).
   - Cérebro = **FastAPI local** (não Edge Function). Supabase vira só banco.
   - Transporte = **WebSocket** via **Cloudflare Tunnel** (grátis, sem VPS).
   - O Hermes **escolhe a IA por projeto/agente** (ModelRouter).
   - Removidos: Edge Functions (hermes/scheduler), push, expo-notifications.
   - UI: **centro de comando** com botão de voz grande, STT + TTS, botões dinâmicos,
     navegação de projetos.

## Decisões fixas
- Grátis, sem VPS, sem serviço pago. Rodar local + túnel.
- Login: e-mail + senha (sem confirmação).
- Foco: **só o núcleo (Fase 1)**, funcionando rápido no mundo real.

## Relacionadas
- [[Hermes - Visão Geral]] · [[Arquitetura]] · [[Próximos Passos]]
