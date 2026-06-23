---
title: Hermes — Visão Geral
tags: [hermes, moc, projeto]
created: 2026-06-23
repo: mayconh4/plataforma-integrada---agnete-ia
branch: claude/affectionate-maxwell-y902t4
---

# ⚡ Hermes — Visão Geral (MOC)

Assistente operacional **online** (modelo estilo Telegram): app React Native/Expo
+ backend **Supabase** (Postgres, Realtime, Edge Functions) + IA via **OpenRouter**.

> [!info] Esta é uma pasta de documentação separada (vault Obsidian).
> Sincronize em uma pasta própria para **não misturar** com suas outras notas.

## Mapa de notas
- [[Arquitetura]]
- [[Backend - Supabase]]
- [[Edge Function - hermes]]
- [[Edge Function - scheduler]]
- [[App - Estrutura]]
- [[Setup - Passo a Passo]]
- [[Histórico e Decisões]]
- [[Próximos Passos]]

## Links do repositório
- 🌿 Branch: https://github.com/mayconh4/plataforma-integrada---agnete-ia/tree/claude/affectionate-maxwell-y902t4
- 📘 SETUP.md: https://github.com/mayconh4/plataforma-integrada---agnete-ia/blob/claude/affectionate-maxwell-y902t4/SETUP.md

```bash
git clone -b claude/affectionate-maxwell-y902t4 \
  https://github.com/mayconh4/plataforma-integrada---agnete-ia.git
```

## O que o Hermes faz hoje
- Conversa com IA generativa (OpenRouter) e **age de verdade**: cria, conclui,
  adia e prioriza tarefas; liga/desliga automações.
- **Botões de múltipla escolha** na conversa (ver [[Edge Function - hermes]] → `present_options`).
- **Realtime**: a tela atualiza sozinha quando o backend muda.
- **Automações agendadas + push** mesmo com o app fechado (ver [[Edge Function - scheduler]]).
- Login por **e-mail + senha**; dados isolados por usuário (RLS).
