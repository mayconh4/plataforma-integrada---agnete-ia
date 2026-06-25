# Viper / Continental — guia para agentes (e humanos)

App **Expo / React Native (SDK 56)** da plataforma Agnete IA. Assistente **Viper**:
chat por voz/texto ligado a um backend Hermes (WebSocket), login Supabase, tarefas,
metas, projetos e um painel de **inteligência dos agentes** por projeto. Tema
claro/escuro com visual *liquid glass*.

> ⚠️ **Expo MUDOU.** SDK 56 (React Native 0.85, React 19, Reanimated 4 + nova
> arquitetura). Antes de codar, confira a API real. Se `docs.expo.dev` estiver
> bloqueada por rede, **use as definições de tipos instaladas** como fonte da
> verdade (ex.: `node_modules/expo-audio/build/Audio.types.d.ts`,
> `node_modules/expo-image-picker/build/ImagePicker.types.d.ts`).
> **Não crie `babel.config.js`** — o `babel-preset-expo` já aplica o plugin de
> worklets do Reanimated automaticamente; um config manual quebrou o build antes.

---

## Rodar / validar

```bash
npm install
npx tsc --noEmit                       # rápido; rode SEMPRE após editar
npx expo export --platform android     # bundla todo o grafo (pega erros de import/babel)
npm start                              # Expo Go no celular
eas build -p android --profile preview # APK instalável
```

O backend de voz/chat sobe à parte (pasta do projeto no PC): `Continental.bat`
(servidor Uvicorn + túnel ngrok). A URL `wss://.../ws` é configurada dentro do app (⚙).

---

## Mapa do código (`src/`)

| Pasta          | O que tem                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| `theme/`       | `colors.ts` (`darkColors`+`lightColors`+`Palette`), `ThemeContext.tsx` (`useTheme`). |
| `backend/`     | Supabase + WebSocket do Hermes: `store.ts` (`useHermes`/`getState`), `connection.ts`, `types.ts`. |
| `intel/`       | Projetos + inteligência dos agentes (local, AsyncStorage): `types.ts`, `store.ts` (`useProjects`). |
| `services/`    | `voiceService.ts` (TTS neural + play/pause), `keepAlive.ts` (sempre ativo), `speech.ts` (voz→texto). |
| `hooks/`       | `useSpeech.ts` (estado global de fala).                                   |
| `lib/`         | `supabase.ts`, `serverConfig.ts`, `voicePref.ts`, `textFormat.ts`, `appPrefs.ts`. |
| `components/`  | UI: `Glass.tsx`, `EditableIcon`, `IconEditorModal`, `SpeakButton`, `Stepper`, chat (`ChatBubble`...), `viz/` (gráficos SVG). |
| `navigation/`  | `TabBar.tsx`.                                                             |
| `screens/`     | Auth, Main (abas + overlays), Voice (chat), Tasks, Goals, Metrics, Projects, ProjectDetail, ProjectEdit. |

Entrada: `index.ts` → `App.tsx` (GestureHandlerRootView → ThemeProvider → useHermes →
Auth/Main).

---

## Regras de ouro

1. **Cor sempre via tema.** `const { colors } = useTheme()`. Estilos que usam cor
   ficam em `const makeStyles = (colors: Palette) => StyleSheet.create({...})` e são
   chamados no componente com `useMemo(() => makeStyles(colors), [colors])`. Tokens
   novos: adicione na interface `Palette` e nos **dois** objetos (`darkColors` e
   `lightColors`). Em BlurView use `tint={colors.blurTint}`.
2. **Vidro = `<GlassCard>`** (`components/Glass.tsx`).
3. **Domínio:** tarefas/metas/mensagens vêm do Supabase via `backend/store` (`useHermes`).
   Projetos + inteligência são locais via `intel/store` (`useProjects`, `updateIntel`,
   `updateProjectMeta`, `setProjectIcon`). Tudo persiste sozinho.
4. **Fala** via `services/voiceService` / hook `useSpeech`. Um texto por vez. Botão
   pronto: `<SpeakButton id=... text=... />`. Auto-narração usa `narrate(id, text)`.
5. Rode `npx tsc --noEmit` após cada mudança e mantenha o estilo dos vizinhos.

---

## Receitas

**Editar o painel de inteligência** → tela `screens/ProjectEditScreen.tsx` (métricas,
skills, caminho/flow, regiões do cérebro, listas de diagnóstico). Salva por
`updateProjectMeta` + `updateIntel`.

**Novo token de tema** → `Palette` + `darkColors` + `lightColors` em `theme/colors.ts`.

**Novo gráfico** → `components/viz/` (use `react-native-svg`; veja `BrainGraph.tsx`).

**Respostas da Viper** → vêm do backend Hermes (WebSocket). UI do chat em
`screens/VoiceScreen.tsx` + `components/ChatBubble.tsx`.

**Ícone editável** → `<EditableIcon onPress={abrir editor} />` + `<IconEditorModal/>`
(envia imagem, pinça p/ zoom; guarda transform).

---

## Limitações conhecidas (não são bugs)

- `Speech.pause/resume` (voz do aparelho) só no iOS/web; no Android o fallback é
  play↔stop. A voz neural (player de áudio do backend) pausa/retoma de verdade.
- "Sempre ativo" = `expo-keep-awake` + sessão de áudio em background. CPU irrestrita
  com a tela **bloqueada** exigiria foreground service nativo (fora do Expo Go).
- Reanimated 4 exige a nova arquitetura (já ligada) e o plugin de worklets aplicado
  pelo `babel-preset-expo` — **não** adicione `babel.config.js` manual.
