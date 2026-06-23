---
title: Backend — FastAPI (Hermes)
tags: [continental, backend, fastapi, hermes, ia]
created: 2026-06-23
pasta: backend/
---

# 🧠 Backend — FastAPI (Hermes)

Roda **no PC** (local). É o cérebro do Continental. Exposto ao celular via
Cloudflare Tunnel (grátis).

## Arquivos
- `backend/app/main.py` — FastAPI + WebSocket `/ws` (autentica pelo JWT do Supabase).
- `backend/app/hermes.py` — o cérebro: **ModelRouter** + chamada à IA + botões.
- `backend/app/supabase_store.py` — persistência via REST (service_role).
- `backend/app/config.py` — env (.env).
- `backend/README.md` — como rodar + Cloudflare Tunnel.

## Conexão com o Hermes (HERMES_BACKEND)
`respond()` despacha conforme `HERMES_BACKEND`:
- **`hermes_api`** (padrão) → `POST {HERMES_API_URL}/chat` do gateway API Server
  (`hermes gateway run --platform api-server`). MESMO cérebro do Telegram.
- `hermes_cli` → `hermes -z "<msg>"` (one-shot, teste rápido).
- `http` / `command` / `python` → Hermes próprio.
- `openrouter` → fallback (ModelRouter: `MODEL_BY_PROJECT`, `choose_model`).

Sessão fixa por usuário (`continental-<user_id>`) mantém o contexto no Hermes.

## Protocolo WebSocket
- App → server: `{type:"user_message", text, project?}`
- Server → app: `{type:"ready"}`, `{type:"thinking"}`, `{type:"message", message:{...}}`
- Auth: `/ws?token=<access_token do Supabase>`

## Rodar
```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env   # preencher
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
cloudflared tunnel --url http://localhost:8000
```

## Relacionadas
- [[Arquitetura]] · [[Setup - Passo a Passo]] · [[Backend - Supabase]]
