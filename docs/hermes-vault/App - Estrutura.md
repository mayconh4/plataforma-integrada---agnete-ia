---
title: App — Estrutura
tags: [continental, app, react-native, expo]
created: 2026-06-23
updated: 2026-06-23
---

# 📱 App — Estrutura (React Native / Expo SDK 56)

## Arquivos principais
- `App.tsx` — gate: config ausente → carregando → login → centro de comando.
- `src/lib/supabase.ts` — cliente Supabase (auth + histórico).
- `src/backend/connection.ts` — **cliente WebSocket** do Hermes (reconexão).
- `src/backend/store.ts` — estado + auth + transporte WS + navegação de projetos.
- `src/backend/useHermes.ts` — hook que conecta a UI ao store.
- `src/services/voiceService.ts` — **TTS** (narração, expo-speech).
- `src/services/speech.ts` — **STT** (entrada por voz, expo-speech-recognition).
- `src/screens/ChatScreen.tsx` — **centro de comando** (mic grande, status, projetos).
- `src/screens/AuthScreen.tsx` — login por e-mail + senha.
- `src/components/` — ChatBubble, ContextualButtons, LiquidGlassButton, SuggestionChips, VoiceToggle.

## Variáveis de ambiente (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_HERMES_WS_URL=wss://....trycloudflare.com/ws
```

## Build
- Dev build: `npx expo start` (a **voz/STT** exige dev build/APK, não Expo Go).
- APK: `eas build -p android --profile preview`.
- Stack pinada para **Expo SDK 56** (RN 0.85.3, React 19.2.3, reanimated 4.3.1).

## Relacionadas
- [[Arquitetura]] · [[Setup - Passo a Passo]]
