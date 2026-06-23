---
title: Setup — Passo a Passo
tags: [hermes, setup]
created: 2026-06-23
fonte: SETUP.md (na raiz do repo)
---

# 🚀 Setup — Passo a Passo

> Versão resumida. O detalhado está em `SETUP.md` na raiz do repositório.

## 1. App
- `cp .env.example .env` e preencher `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (Supabase → Project Settings → API).

## 2. Banco
- Rodar `supabase/migrations/0001_init.sql` no SQL Editor.
- Rodar `supabase/migrations/0002_scheduling_push.sql`.

## 3. Login por senha
- Authentication → Providers → Email → **desativar "Confirm email"** (entra na hora).

## 4. IA (Edge Function hermes)
```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxx
supabase functions deploy hermes
```

## 5. Push + automações agendadas
```bash
eas init                         # gera projectId
# configurar FCM nas credenciais do EAS (Android)
supabase functions deploy scheduler
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
# rodar supabase/scheduler_cron.sql (trocar PROJECT_REF e CRON_SECRET)
```

## 6. Rodar
```bash
npm install
npx expo start            # ou: eas build -p android --profile preview
```

## Relacionadas
- [[Edge Function - hermes]] · [[Edge Function - scheduler]] · [[Próximos Passos]]
