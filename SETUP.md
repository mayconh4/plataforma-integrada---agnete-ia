# Continental — Setup

**Continental** é a interface premium (app Android) que conecta o **Maycon** ao
**Hermes** — o agente de IA que roda **no seu computador**. Substitui o Telegram
como interface humano↔agente.

```
Celular (app Continental)
   ↓  WebSocket (Cloudflare Tunnel, grátis)
Hermes / FastAPI (no seu PC)  →  escolhe a IA por projeto/agente (OpenRouter)
   ↓
Supabase (banco: auth + histórico)
```

> **Fase 1 (núcleo):** Home centro de comando, conversa por texto e voz,
> botões dinâmicos, respostas narradas, navegação para projetos.
> Sem push/automações ainda.

---

## 1. Supabase (banco + login)
1. Crie o projeto (já feito) e rode `supabase/migrations/0001_init.sql` no SQL Editor.
2. **Auth → Providers → Email**: desative *Confirm email* (login por senha entra na hora).
3. Em **Project Settings → API**, copie: `Project URL`, `anon key` e `service_role key`.

> A `service_role key` é secreta — vai **só no backend** (seu PC), nunca no app.

## 2. Backend (Hermes) — no seu computador
Veja [`backend/README.md`](backend/README.md). Resumo:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # preencha SUPABASE_*, OPENROUTER_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
O Hermes escolhe a IA por projeto/agente em `backend/app/hermes.py`
(`MODEL_BY_PROJECT` / `choose_model`). Chave do OpenRouter: https://openrouter.ai/keys

## 3. Expor o backend para o celular (Cloudflare Tunnel, grátis)
```bash
cloudflared tunnel --url http://localhost:8000
```
Copie a URL pública e use a forma **wss** com `/ws` no app (passo 4).

## 4. App (Continental)
```bash
cp .env.example .env
```
```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_HERMES_WS_URL=wss://SEU-TUNNEL.trycloudflare.com/ws
```
```bash
npm install
npx expo start            # dev build (a voz/STT não funciona no Expo Go)
# ou: eas build -p android --profile preview
```

> **Voz (STT)** usa `expo-speech-recognition` — precisa de **dev build/APK**
> (não funciona no Expo Go). O microfone aparece na barra inferior.

---

## Fluxo de uso
1. Abra o app → **centro de comando** ("O que temos para hoje?").
2. Fale (botão de microfone) ou digite. O Hermes responde (e narra, se a voz estiver ligada).
3. Quando o Hermes oferecer **botões**, toque para responder rápido.
4. Se ele sugerir **"Abrir projeto: X"**, o app entra no contexto daquele projeto
   (as próximas mensagens vão com esse contexto, e o Hermes pode usar outra IA).

## Estrutura do repo
- `App.tsx`, `src/screens/`, `src/components/`, `src/backend/`, `src/services/` — app.
- `backend/` — FastAPI (Hermes local) + WebSocket.
- `supabase/migrations/0001_init.sql` — schema + RLS.
- `docs/hermes-vault/` — documentação em formato Obsidian.
