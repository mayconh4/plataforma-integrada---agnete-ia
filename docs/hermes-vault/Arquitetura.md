---
title: Arquitetura
tags: [continental, arquitetura]
created: 2026-06-23
updated: 2026-06-23
---

# 🏗️ Arquitetura (Continental)

```
App (React Native / Expo SDK 56)
  ├─ Login por senha (Supabase Auth)
  ├─ Conecta no Hermes via WebSocket (?token=<jwt do Supabase>)
  ├─ Voz: STT (expo-speech-recognition) + TTS (expo-speech)
  └─ Botões dinâmicos + navegação de projetos

Cloudflare Tunnel (grátis)  → expõe o FastAPI local como wss://...

Hermes / FastAPI (no PC do Maycon)
  ├─ WebSocket /ws  → recebe mensagem, decide a IA, responde
  ├─ ModelRouter    → escolhe a IA por projeto/agente (OpenRouter)
  └─ persiste no Supabase (messages)

Supabase  → Postgres + Auth + RLS (banco e histórico; NÃO é o cérebro)
```

## Fluxo de uma mensagem
1. App envia `{type:"user_message", text, project?}` pelo WS.
2. FastAPI persiste a msg, responde `{type:"thinking"}`.
3. Hermes escolhe o modelo (projeto > preferência > default) e chama a IA.
4. Se precisa de decisão → `present_options` → botões.
5. FastAPI persiste a resposta e envia `{type:"message", message:{...}}`.

## Decisão importante
O **cérebro é local** (FastAPI/Hermes), não uma Edge Function. O Supabase é só
o banco. Transporte = WebSocket via Cloudflare Tunnel (grátis, sem VPS).

## Relacionadas
- [[Backend - FastAPI (Hermes)]] · [[Backend - Supabase]] · [[App - Estrutura]]
