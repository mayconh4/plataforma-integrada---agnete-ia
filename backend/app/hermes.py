"""Hermes — o cérebro do Continental.

Responsabilidades:
- Decidir QUAL IA generativa usar para cada projeto/agente (ModelRouter).
- Conversar com o usuário, tomar iniciativa e propor próximos passos.
- Emitir botões dinâmicos (múltipla escolha) quando precisar de decisão.

Este módulo é o ponto de integração. Hoje ele responde via OpenRouter; quando
o Hermes "real" (local) estiver pronto, basta plugá-lo em `respond()`.
"""
from typing import Any, Optional

import httpx

from . import config

# ---------------------------------------------------------------------------
# Roteador de modelos: o Hermes escolhe a melhor IA por projeto/agente.
# Edite livremente. Slugs em https://openrouter.ai/models
# ---------------------------------------------------------------------------

DEFAULT_MODEL = "anthropic/claude-3.5-sonnet"

MODEL_BY_PROJECT: dict[str, str] = {
    "perfection_airsoft": "anthropic/claude-3.5-sonnet",  # marketing/estratégia
    "app_barber": "openai/gpt-4o-mini",
    "app_beleza": "openai/gpt-4o-mini",
}

MODEL_BY_PREFERENCE: dict[str, str] = {
    "claude": "anthropic/claude-3.5-sonnet",
    "gpt": "openai/gpt-4o-mini",
    "gemini": "google/gemini-flash-1.5",
    "deepseek": "deepseek/deepseek-chat",
    "local": "meta-llama/llama-3.1-8b-instruct",
}


def choose_model(project: Optional[str], preferred: Optional[str]) -> str:
    """Decide o modelo: projeto tem prioridade, depois preferência, depois default."""
    if project and project in MODEL_BY_PROJECT:
        return MODEL_BY_PROJECT[project]
    if preferred and preferred in MODEL_BY_PREFERENCE:
        return MODEL_BY_PREFERENCE[preferred]
    return DEFAULT_MODEL


SYSTEM_PROMPT = """Você é o Hermes, o sistema operacional pessoal de inteligência do Maycon,
acessado pela interface Continental (que substitui o Telegram).
Você é operador, conselheiro e executor: não apenas responde — analisa o contexto,
toma iniciativa e recomenda prioridades de forma objetiva e em português do Brasil.
Trate o usuário com proximidade e foco (pode chamá-lo de "senhor" ocasionalmente, sem exagero).

Sempre que precisar de uma DECISÃO ou quiser oferecer caminhos, retorne botões de
múltipla escolha pela ferramenta present_options (2 a 4 opções curtas). O texto da
opção é o que o usuário enviará de volta ao tocar.
Quando identificar que um assunto pertence a um projeto específico (ex.: Perfection
Airsoft, App Barber, App Beleza), ofereça uma opção começando com "Abrir projeto: <nome>"."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "present_options",
            "description": "Apresenta uma pergunta com botões de múltipla escolha. Resposta final: não chame outras ferramentas junto.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Pergunta/instrução acima dos botões"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "2 a 4 opções curtas e autoexplicativas",
                    },
                },
                "required": ["text", "options"],
            },
        },
    }
]


async def respond(
    text: str,
    history: list[dict[str, Any]],
    settings: dict[str, Any],
    project: Optional[str] = None,
) -> dict[str, Any]:
    """Gera a resposta do Hermes. Retorna {text, buttons, narrate}."""
    model = choose_model(project, settings.get("preferred_model"))

    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history:
        messages.append(
            {"role": "assistant" if m["role"] == "hermes" else "user", "content": m["text"]}
        )
    messages.append({"role": "user", "content": text})

    if not config.OPENROUTER_API_KEY:
        return {
            "text": "OPENROUTER_API_KEY não configurada no backend. Configure o .env do servidor.",
            "buttons": None,
            "narrate": False,
        }

    headers = {
        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://continental.app",
        "X-Title": "Continental",
    }
    body = {"model": model, "messages": messages, "tools": TOOLS, "tool_choice": "auto"}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(config.OPENROUTER_URL, headers=headers, json=body)
            if resp.status_code != 200:
                return {
                    "text": f"Não consegui falar com a IA agora ({resp.status_code}).",
                    "buttons": None,
                    "narrate": False,
                }
            data = resp.json()
    except Exception as e:  # noqa: BLE001
        return {"text": f"Erro ao contatar a IA: {e}", "buttons": None, "narrate": False}

    choice = (data.get("choices") or [{}])[0].get("message", {})
    tool_calls = choice.get("tool_calls") or []

    for call in tool_calls:
        if call.get("function", {}).get("name") == "present_options":
            import json

            try:
                args = json.loads(call["function"].get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            options = args.get("options") or []
            buttons = [
                {
                    "id": f"opt_{i}",
                    "label": str(o),
                    "action": str(o),
                    "variant": "primary" if i == 0 else None,
                }
                for i, o in enumerate(options[:4])
            ]
            return {
                "text": args.get("text") or "Escolha uma opção:",
                "buttons": buttons or None,
                "narrate": True,
            }

    return {"text": choice.get("content") or "Pronto.", "buttons": None, "narrate": True}
