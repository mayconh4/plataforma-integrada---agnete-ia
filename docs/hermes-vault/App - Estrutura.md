---
title: App — Estrutura
tags: [hermes, app, react-native, expo]
created: 2026-06-23
---

# 📱 App — Estrutura (React Native / Expo SDK 56)

## Arquivos principais
- `App.tsx` — gate: configuração ausente → carregando → login → chat.
- `src/lib/supabase.ts` — cliente Supabase (url-polyfill + AsyncStorage).
- `src/backend/store.ts` — estado + auth + Realtime + envio à Edge Function.
- `src/backend/useHermes.ts` — hook que conecta a UI ao store.
- `src/services/notifications.ts` — permissão + Expo push token → `push_tokens`.
- `src/services/voiceService.ts` — voz (expo-speech), persistida em settings.
- `src/screens/AuthScreen.tsx` — login/cadastro por e-mail + senha.
- `src/screens/ChatScreen.tsx` — conversa, "digitando…", botão Sair.
- `src/components/ChatBubble.tsx`, `ContextualButtons.tsx`, `LiquidGlassButton.tsx`,
  `SuggestionChips.tsx`, `VoiceToggle.tsx` — UI da conversa.

## Variáveis de ambiente (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build
- Dev: `npx expo start`
- APK: `eas build -p android --profile preview`
- Stack pinada para **Expo SDK 56** (RN 0.85.3, React 19.2.3, reanimated 4.3.1, worklets 0.8.3).

## Relacionadas
- [[Arquitetura]] · [[Setup - Passo a Passo]]
