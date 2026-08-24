# Palavra de ativação "continental" (Picovoice Porcupine)

O detector da palavra **"continental"** precisa de 3 coisas geradas gratuitamente
no Picovoice Console. Enquanto elas não existirem, o app funciona normal (texto,
botões e voz manual) e apenas o wake word fica inativo.

## Passo a passo (uma vez só)

1. Crie uma conta grátis em https://console.picovoice.ai
2. Copie o seu **AccessKey** e cole em `src/config/wakeWord.ts`
   (ou defina a variável de ambiente `EXPO_PUBLIC_PICOVOICE_KEY`).
3. Em **Porcupine → Wake Word**:
   - Digite `continental`
   - Idioma: **Portuguese**
   - Plataforma: gere para **Android** e **iOS**
   - Baixe os arquivos `.ppn`
4. Baixe também o modelo de idioma português **`porcupine_params_pt.pv`**
   (disponível no repositório do Porcupine / na própria console).
5. Coloque os arquivos nos projetos nativos (após `npx expo prebuild`):

   **Android** — `android/app/src/main/assets/`
   - `continental_android.ppn`
   - `porcupine_params_pt.pv`

   **iOS** — arraste para o bundle no Xcode:
   - `continental_ios.ppn`
   - `porcupine_params_pt.pv`

Os nomes acima já estão configurados em `src/config/wakeWord.ts`. Se você usar
outros nomes, ajuste lá.

## Importante

- Só funciona em **development/production build** (`npx expo run:android`),
  nunca no Expo Go.
- No Android a escuta contínua roda em segundo plano via foreground service.
- No iOS a Apple corta o microfone com o app totalmente fechado — funciona com
  o app aberto ou em segundo plano recente.
