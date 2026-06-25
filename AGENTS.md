# Viper — guia para agentes (e humanos)

App **Expo / React Native (SDK 56)** da plataforma integrada Agnete IA. Assistente
operacional **Viper**: chat por voz/texto, tarefas, metas, projetos e um painel de
**inteligência dos agentes** por projeto. Tema claro/escuro com visual *liquid glass*.

> ⚠️ **Expo MUDOU.** Este projeto usa o SDK 56 (React Native 0.85, React 19,
> Reanimated 4 + nova arquitetura). Antes de escrever código, confira a API real.
> A doc oficial (`docs.expo.dev`) pode estar bloqueada por política de rede em
> alguns ambientes — nesse caso, **use as definições de tipos instaladas como
> fonte da verdade** (mais precisas que a doc), ex.:
> `node_modules/expo-speech/build/Speech.types.d.ts`,
> `node_modules/expo-audio/build/Audio.types.d.ts`,
> `node_modules/expo-image-picker/build/ImagePicker.types.d.ts`.

---

## Como rodar / validar

```bash
npm install            # instala dependências
npm run typecheck      # tsc --noEmit (rápido; rode SEMPRE após editar)
npm start              # Metro / Expo Go no celular (escaneie o QR)
npm run android        # abre no emulador/dispositivo Android
npm run build:preview  # eas build -p android --profile preview (gera APK)
```

Sem device aqui? A verificação mais forte offline é gerar o bundle:
`npx expo export --platform android` — compila todo o grafo de módulos com Metro
(pega erros de import, babel/worklets, etc.). Faça isso antes de commitar mudanças
estruturais.

---

## Mapa do código (`src/`)

| Pasta            | O que tem                                                            |
| ---------------- | ------------------------------------------------------------------- |
| `theme/`         | `themes.ts` (tokens dark + light) e `ThemeContext.tsx` (`useTheme`). |
| `store/`         | `types.ts` (modelo de dados), `AppStore.tsx` (`useStore`), `seed.ts`.|
| `services/`      | `voiceService.ts` (TTS play/pause), `keepAlive.ts` (sempre ativo), `viperEngine.ts` (respostas do chat). |
| `hooks/`         | `useSpeech.ts` (estado global de fala).                             |
| `components/`    | UI reutilizável. `glass/` = superfícies de vidro; `viz/` = gráficos.|
| `screens/`       | Uma tela por arquivo (Chat, Resumo, Tarefas, Projetos, Metas, Conta, ProjetoDetail, ProjetoEdit). |
| `navigation/`    | `RootNavigator.tsx` — troca de abas + overlays (detalhe/edição/conta). Sem libs de navegação; é por estado. |
| `utils/`         | helpers puros (ex.: `priority.ts`).                                  |

Entrada: `index.ts` → `App.tsx` (providers: GestureHandlerRootView → SafeAreaProvider
→ ThemeProvider → AppStoreProvider → RootNavigator).

---

## Regras de ouro (siga sempre)

1. **Nunca hardcode cor.** Use `const { theme } = useTheme()` e os tokens de
   `theme/themes.ts`. Se faltar um token, **adicione na interface `Theme` e nos DOIS
   temas** (`darkTheme` e `lightTheme`) — eles têm que ficar em sincronia.
2. **Superfície de vidro = `<GlassView>`** (`components/glass/GlassView.tsx`). Não
   recrie BlurView na mão.
3. **Dados são editáveis e persistidos.** Toda leitura/escrita de tarefas, metas,
   projetos e settings passa pelo `useStore()` (AsyncStorage por baixo). Não guarde
   estado de domínio em `useState` solto.
4. **Fala** sempre via `services/voiceService.ts` / hook `useSpeech` — um texto fala
   por vez. Botão pronto: `<SpeakButton id=... text=... />`.
5. Rode `npm run typecheck` depois de cada mudança. Mantenha o estilo dos arquivos
   vizinhos (componentes funcionais, `StyleSheet.create`, comentários enxutos).

---

## Receitas (“como eu faço…”)

**Adicionar um campo editável a Tarefa/Meta/Projeto**
1. Acrescente o campo em `src/store/types.ts`.
2. Dê um default em `src/store/seed.ts` e nos `add*` de `AppStore.tsx`.
3. Exiba na tela correspondente e edite via `RecordEditModal` (texto/prioridade/
   progresso) ou, para projetos, em `screens/ProjetoEditScreen.tsx`.

**Novo token/ajuste de tema** → edite `Theme` + `darkTheme` + `lightTheme` em
`theme/themes.ts`. Pronto, propaga pra todo app.

**Nova aba** → adicione a `TabKey`/`TABS` em `components/TabBar.tsx`, crie a tela em
`screens/`, e registre no `switch` de `RootNavigator.tsx`.

**Novo gráfico/visual** → crie em `components/viz/` (use `react-native-svg`; veja
`BrainGraph.tsx` e `ProgressRing.tsx` como modelo) e consuma no `ProjetoDetailScreen`.

**Mudar respostas/voz da Viper** → `services/viperEngine.ts` (intenções por palavra-
chave + ações).

**Editar o painel de inteligência** já tem UI completa: tela `ProjetoEditScreen`
(métricas, skills, caminho/flow, regiões do cérebro e listas de diagnóstico). A store
expõe `updateProjectIntel(id, patch)`.

---

## Limitações conhecidas (não são bugs)

- `Speech.pause()/resume()` só existem no iOS/web. No Android o `SpeakButton` faz
  play↔stop (reinicia o texto) — é o fallback esperado.
- “Sempre ativo” usa `expo-keep-awake` + sessão de áudio em background. Execução
  irrestrita com o aparelho **bloqueado** exigiria um *foreground service* nativo
  (build customizado) — fora do Expo Go.
- Reanimated 4 exige a **nova arquitetura** (já ligada em `app.json`) e o plugin
  `react-native-worklets/plugin` (já em `babel.config.js`, deve ser o último plugin).
