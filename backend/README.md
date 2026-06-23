# Continental — Backend (Hermes local)

FastAPI + WebSocket. Roda **no seu computador**; o app se conecta via Cloudflare
Tunnel (grátis). O Supabase é só o banco. A IA é escolhida pelo Hermes por
projeto/agente (ver `app/hermes.py` → `MODEL_BY_PROJECT` / `choose_model`).

## 1. Instalar e configurar
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # preencha SUPABASE_*, OPENROUTER_API_KEY
```

> A `SUPABASE_SERVICE_ROLE_KEY` é secreta e fica **só aqui**, nunca no app.

## 2. Rodar
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# teste: http://localhost:8000/health
```

## 3. Expor para o celular (Cloudflare Tunnel, grátis)
```bash
# instale o cloudflared (https://developers.cloudflare.com/cloudflare-tunnel/)
cloudflared tunnel --url http://localhost:8000
```
Ele imprime uma URL pública `https://<algo>.trycloudflare.com`.
No app, use a versão **wss** apontando para `/ws`:

```
EXPO_PUBLIC_HERMES_WS_URL=wss://<algo>.trycloudflare.com/ws
```

> A URL do `trycloudflare` muda a cada execução. Para uma URL fixa, crie um
> tunnel nomeado na sua conta Cloudflare (também grátis).

## Plugar o SEU Hermes (cérebro)
O ponto de integração é `app/hermes.py` → `respond()`. Escolha em `.env`:

| `HERMES_BACKEND` | Como funciona | Variáveis |
|---|---|---|
| `openrouter` (default) | este backend fala direto com a IA (ModelRouter) | `OPENROUTER_API_KEY` |
| `http` | chama o seu Hermes por HTTP | `HERMES_HTTP_URL`, `HERMES_HTTP_AUTH?` |
| `command` | executa seu Hermes (CLI), JSON via stdin/stdout | `HERMES_COMMAND` |
| `python` | importa `modulo:funcao` do seu Hermes | `HERMES_PYTHON_TARGET` |

O backend manda este JSON ao seu Hermes:
```json
{ "text": "...", "history": [{"role":"user|hermes","text":"..."}],
  "settings": {"preferred_model":"claude"}, "project": null, "user_id": "uuid" }
```
E espera de volta:
```json
{ "text": "resposta", "buttons": ["Opção A","Opção B"], "narrate": true }
```
`buttons` é opcional (vira botões de múltipla escolha no app). Pode devolver só uma string.

## Protocolo WebSocket
- App → server: `{ "type": "user_message", "text": "...", "project": "opcional" }`
- Server → app:
  - `{ "type": "ready", "user": {...} }`
  - `{ "type": "thinking" }`
  - `{ "type": "message", "message": { id, role, text, buttons, narrate, created_at } }`

Autenticação: o app conecta em `/ws?token=<access_token_do_supabase>`.
