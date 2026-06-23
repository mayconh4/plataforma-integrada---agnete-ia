---
title: Edge Function — hermes
tags: [hermes, edge-function, ia, openrouter]
created: 2026-06-23
arquivo: supabase/functions/hermes/index.ts
---

# 🧠 Edge Function — `hermes`

O "cérebro": recebe a mensagem, monta o contexto, chama a IA via **OpenRouter**
com **tool-calling** e grava a resposta. O Realtime entrega ao app.

## Ferramentas (tools) que a IA pode chamar
- `present_options(text, options[])` — **botões de múltipla escolha** (resposta final).
- `create_task(title, priority?)`
- `complete_task(title)` · `complete_all_pending()`
- `defer_all_pending(minutes)`
- `set_priority(title, priority)`
- `toggle_automation(name)`

## Botões de múltipla escolha
Quando a IA chama `present_options`, a função grava a mensagem com `buttons`
(`messages.buttons`). O app renderiza com `ContextualButtons`; ao tocar, o
**texto da opção** volta como nova mensagem do usuário ao Hermes.

## Configuração
- Secret: `OPENROUTER_API_KEY` (`supabase secrets set ...`).
- Modelo vem de `settings.preferred_model` → mapeado em `MODEL_MAP`:
  `claude → anthropic/claude-3.5-sonnet`, `gpt → openai/gpt-4o-mini`,
  `gemini → google/gemini-flash-1.5`, `deepseek → deepseek/deepseek-chat`,
  `local → meta-llama/llama-3.1-8b-instruct` (ajuste os slugs conforme openrouter.ai/models).

## Relacionadas
- [[Arquitetura]] · [[Setup - Passo a Passo]]
