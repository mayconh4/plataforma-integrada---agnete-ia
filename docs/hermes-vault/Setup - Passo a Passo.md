---
title: Setup — Passo a Passo
tags: [continental, setup]
created: 2026-06-23
updated: 2026-06-23
fonte: SETUP.md (raiz) e backend/README.md
---

# 🚀 Setup — Passo a Passo

> Detalhado em `SETUP.md` (raiz) e `backend/README.md`.

## 1. Supabase
- Rodar `supabase/migrations/0001_init.sql`.
- Auth → Email → desativar *Confirm email*.
- Copiar `Project URL`, `anon key`, `service_role key`.

## 2. Backend (Hermes, no PC)
```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env   # preencher SUPABASE_*, OPENROUTER_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 3. Túnel (grátis)
```bash
cloudflared tunnel --url http://localhost:8000
```

## 4. App
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_HERMES_WS_URL=wss://....trycloudflare.com/ws
```
```bash
npm install && npx expo start     # ou eas build -p android --profile preview
```

## Relacionadas
- [[Backend - FastAPI (Hermes)]] · [[Próximos Passos]]
