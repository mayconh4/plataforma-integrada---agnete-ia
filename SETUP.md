# Hermes — Setup (online com Supabase + OpenRouter)

O Hermes agora roda **online**: o app é o cliente, o **Supabase** guarda os dados
(com Realtime para sincronizar em tempo real) e uma **Edge Function** usa a IA via
**OpenRouter** para responder e agir sobre suas tarefas/automações.

Siga os passos abaixo **uma vez** para colocar de pé.

---

## 1. Variáveis de ambiente do app

Copie `.env.example` para `.env` e preencha com os dados do seu projeto
(Supabase → **Project Settings → API**):

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon / public key (pode ir no app)
```

> A `anon key` é publicável — quem protege os dados é o RLS (Row Level Security),
> que a migration configura. **Nunca** coloque a `service_role key` no app.

---

## 2. Criar as tabelas (schema + RLS + realtime)

No Supabase, abra **SQL Editor**, cole o conteúdo de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) e execute.

Isso cria as tabelas `settings`, `tasks`, `automations`, `messages`, ativa RLS por
usuário, publica tudo no Realtime e cria um gatilho que popula dados de exemplo +
mensagem de boas-vindas quando um novo usuário se cadastra.

---

## 3. Login por senha

Em **Authentication → Providers → Email**, mantenha o provedor **Email** ligado.
Para que o cadastro/login por senha funcione **na hora** (sem caixa de e-mail),
**desative** a opção *"Confirm email"*. (Se preferir manter, o usuário precisará
confirmar o e-mail antes do primeiro login.)

---

## 4. Edge Function `hermes` (o cérebro com IA)

Precisa da [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# 1. Login e link com o projeto (pega o ref em Project Settings → General)
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 2. Configure a chave do OpenRouter como secret (NUNCA vai pro app)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx

# 3. Deploy da função
supabase functions deploy hermes
```

> Pegue a chave em https://openrouter.ai/keys (a OpenRouter cobra por uso/token).

### Escolha de modelo
O modelo usado vem de `settings.preferred_model` e é mapeado em
`supabase/functions/hermes/index.ts` (`MODEL_MAP`). Os slugs padrão:

| preferred_model | OpenRouter slug |
|---|---|
| claude   | `anthropic/claude-3.5-sonnet` |
| gpt      | `openai/gpt-4o-mini` |
| gemini   | `google/gemini-flash-1.5` |
| deepseek | `deepseek/deepseek-chat` |
| local    | `meta-llama/llama-3.1-8b-instruct` |

Confira os slugs atuais em https://openrouter.ai/models e ajuste se quiser outro modelo.

---

## 5. Rodar o app

```bash
npm install
npx expo start            # dev (Expo Go / dev client)
```

Ou gerar o APK:

```bash
eas build -p android --profile preview
```

Na primeira vez: **Cadastre-se** com e-mail + senha → o Hermes já abre com dados de
exemplo e responde via IA. Tudo o que você pedir (criar tarefa, concluir, adiar,
priorizar, ligar/desligar automação) é executado de verdade no banco e aparece em
tempo real.

---

## 6. Push notifications + automações agendadas (app fechado)

Faz o servidor agir **mesmo com o app fechado**: dispara automações no horário,
reativa tarefas adiadas e envia **push** ao usuário.

### 6.1. Aplicar a 2ª migration
No SQL Editor, rode [`supabase/migrations/0002_scheduling_push.sql`](supabase/migrations/0002_scheduling_push.sql).
Cria a tabela `push_tokens`, adiciona o agendamento estruturado das automações
(hora/minuto/dias, em **America/Sao_Paulo**) e habilita as extensões `pg_cron` e `pg_net`.

### 6.2. Credenciais de push (Android = FCM)
Push remoto **não funciona no Expo Go** — precisa de um **dev build** ou do **APK (EAS)**.

```bash
eas init        # gera o projectId (vai para app.json -> extra.eas.projectId)
```

Para Android, configure o **FCM** nas credenciais do EAS (necessário p/ push):
veja https://docs.expo.dev/push-notifications/fcm-credentials/ . Depois de logar no
app (num dev build/APK), o token de push é salvo automaticamente em `push_tokens`.

### 6.3. Deploy do scheduler + cron
```bash
supabase functions deploy scheduler
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)   # guarde esse valor
```
Agora agende a execução: abra [`supabase/scheduler_cron.sql`](supabase/scheduler_cron.sql),
substitua `<PROJECT_REF>` e `<CRON_SECRET>` (o MESMO do passo acima) e rode no SQL Editor.
O cron passa a chamar a função `scheduler` **a cada minuto**.

> Teste rápido: crie uma automação com horário daqui a 1–2 min (ou peça ao Hermes
> "adie minhas tarefas por 1 minuto") e aguarde — deve chegar uma push e uma mensagem.

---

## Arquitetura (resumo)

```
App (React Native)
  ├─ login por senha (Supabase Auth)
  ├─ insere mensagem -> chama Edge Function "hermes"
  └─ Realtime: ouve messages/tasks/automations/settings (atualiza a tela na hora)

Supabase
  ├─ Postgres + RLS (dados isolados por usuário)
  ├─ Realtime (websocket)
  ├─ Edge Function "hermes"      -> OpenRouter (IA) + tool-calling -> age no banco
  └─ Edge Function "scheduler"   -> pg_cron (1/min) -> automações no horário,
                                    tarefas adiadas vencidas -> mensagem + push (Expo)
```
