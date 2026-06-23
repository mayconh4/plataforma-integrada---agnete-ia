---
title: Continental — Visão Geral
tags: [continental, hermes, moc, projeto]
created: 2026-06-23
updated: 2026-06-23
repo: mayconh4/plataforma-integrada---agnete-ia
branch: claude/affectionate-maxwell-y902t4
---

# ⚡ Continental — Visão Geral (MOC)

**Continental** é a interface premium (app Android) que conecta o Maycon ao
**Hermes** — o agente de IA que roda **no computador do Maycon**. Substitui o
Telegram como interface humano↔agente. Pense em "sistema operacional pessoal de IA".

```
Celular (Continental) → WebSocket (Cloudflare Tunnel) → Hermes/FastAPI (local) → Supabase (banco)
```

## Mapa de notas
- [[Arquitetura]]
- [[Backend - FastAPI (Hermes)]]
- [[Backend - Supabase]]
- [[App - Estrutura]]
- [[Setup - Passo a Passo]]
- [[Histórico e Decisões]]
- [[Próximos Passos]]

## Núcleo (Fase 1)
- Home **centro de comando** (campo + **botão de voz grande**).
- Conversa por **texto e voz** (STT + TTS).
- **Botões dinâmicos** de múltipla escolha (o Hermes gera conforme o contexto).
- Respostas **narradas** por voz.
- Navegação para **projetos** quando o Hermes recomenda ("Abrir projeto: X").

## Filosofia
Não é um app de menus. É a sensação de **entrar num sistema inteligente vivo**.
O Hermes toma iniciativa, analisa contexto e recomenda prioridades.

## Links
- Branch: https://github.com/mayconh4/plataforma-integrada---agnete-ia/tree/claude/affectionate-maxwell-y902t4
- SETUP.md: https://github.com/mayconh4/plataforma-integrada---agnete-ia/blob/claude/affectionate-maxwell-y902t4/SETUP.md
