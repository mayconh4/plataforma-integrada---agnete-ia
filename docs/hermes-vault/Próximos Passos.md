---
title: Próximos Passos
tags: [continental, backlog]
created: 2026-06-23
updated: 2026-06-23
---

# ✅ Próximos Passos / Backlog

## Fase 1 — concluído (a validar rodando)
- [x] Backend FastAPI + WebSocket (Hermes local).
- [x] App: transporte WS, centro de comando, status de conexão.
- [x] STT (entrada por voz) + TTS (narração).
- [x] Botões dinâmicos de múltipla escolha.
- [x] Navegação de projeto (banner de contexto).
- [x] ModelRouter (Hermes escolhe a IA por projeto).

## Pendências do usuário (setup)
- [ ] `.env` do app (Supabase URL/anon + `EXPO_PUBLIC_HERMES_WS_URL`).
- [ ] `.env` do backend (Supabase + service_role + OpenRouter).
- [ ] Rodar `uvicorn` + `cloudflared`.
- [ ] Dev build/APK para a voz (STT não roda no Expo Go).

## Fase 2+ (futuro)
- [ ] Plugar o Hermes "real" local em `respond()`.
- [ ] Ambientes de projeto completos (agentes, automações, processos próprios).
- [ ] URL fixa de túnel (tunnel nomeado Cloudflare).
- [ ] Conversas separadas por projeto (hoje o projeto é só contexto).
- [ ] Push/automações agendadas (reaproveitar o que foi feito antes).

## Relacionadas
- [[Hermes - Visão Geral]] · [[Histórico e Decisões]]
