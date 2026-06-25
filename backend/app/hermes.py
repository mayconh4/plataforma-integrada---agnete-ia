"""Hermes — o cérebro do Continental.

`respond()` é o ÚNICO ponto de integração. Ele despacha para o backend escolhido
em HERMES_BACKEND:
  - "openrouter": conversa direto com a IA (com ModelRouter + botões dinâmicos).
  - "http":       chama o SEU Hermes local por HTTP.
  - "command":    executa o SEU Hermes como script/CLI (JSON via stdin/stdout).
  - "python":     importa e chama uma função do SEU Hermes.

Contrato de retorno (sempre): {"text": str, "buttons": list|None, "narrate": bool}.
buttons: lista de {"label": str} (ou strings) → vira botão de múltipla escolha no app.
"""
import asyncio
import importlib
import json
import re
from typing import Any, Optional

import httpx

from . import config

# ---------------------------------------------------------------------------
# ModelRouter: o Hermes escolhe a melhor IA por projeto/agente (caminho openrouter)
# ---------------------------------------------------------------------------

DEFAULT_MODEL = "anthropic/claude-3.5-sonnet"

MODEL_BY_PROJECT: dict[str, str] = {
    "perfection_airsoft": "anthropic/claude-3.5-sonnet",
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
    if project and project in MODEL_BY_PROJECT:
        return MODEL_BY_PROJECT[project]
    if preferred and preferred in MODEL_BY_PREFERENCE:
        return MODEL_BY_PREFERENCE[preferred]
    return DEFAULT_MODEL


# ---------------------------------------------------------------------------
# Normalização de botões e do retorno
# ---------------------------------------------------------------------------

def normalize_buttons(raw: Any) -> Optional[list[dict[str, Any]]]:
    if not raw or not isinstance(raw, list):
        return None
    buttons = []
    for i, item in enumerate(raw[:4]):
        label = item if isinstance(item, str) else str(item.get("label", "")) if isinstance(item, dict) else ""
        if not label:
            continue
        buttons.append({"id": f"opt_{i}", "label": label, "action": label, "variant": "primary" if i == 0 else None})
    return buttons or None


def _str_list(raw: Any) -> Optional[list[str]]:
    if not raw or not isinstance(raw, list):
        return None
    out = [str(x) for x in raw if str(x).strip()]
    return out or None


def normalize_reply(data: Any) -> dict[str, Any]:
    """Aceita string ou dict do seu Hermes e devolve o contrato padrão."""
    if isinstance(data, str):
        return {"text": data, "buttons": None, "suggestions": None, "narrate": True}
    if isinstance(data, dict):
        text = str(data.get("text") or data.get("reply") or data.get("message") or "")
        return {
            "text": text or "Pronto.",
            "buttons": normalize_buttons(data.get("buttons") or data.get("options")),
            "suggestions": _str_list(data.get("suggestions")),
            "narrate": bool(data.get("narrate", True)),
        }
    return {"text": "Pronto.", "buttons": None, "suggestions": None, "narrate": True}


def _session_id(user_id: Optional[str]) -> str:
    return f"{config.HERMES_CLI_SESSION_PREFIX}-{user_id or 'default'}"


# ---------------------------------------------------------------------------
# Adaptador: Hermes API Server (RECOMENDADO) — `hermes gateway run --platform api-server`
# Mesmo núcleo do Telegram (tools, skills, memória). POST /chat.
# ---------------------------------------------------------------------------

def _api_url() -> str:
    return f"{config.HERMES_API_URL}/v1/chat/completions"


def _api_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {config.HERMES_API_KEY}", "Content-Type": "application/json"}


def _api_messages(payload: dict[str, Any]) -> list[dict[str, str]]:
    """Histórico + mensagem no formato OpenAI. Sem system prompt: o Hermes Agent
    já tem a própria persona/memória (mesmo cérebro do Telegram)."""
    msgs: list[dict[str, str]] = []
    for m in payload.get("history") or []:
        msgs.append({"role": "assistant" if m.get("role") == "hermes" else "user", "content": m.get("text", "")})
    msgs.append({"role": "user", "content": payload["text"]})
    return msgs


async def _respond_hermes_api(payload: dict[str, Any]) -> dict[str, Any]:
    body = {"model": config.HERMES_API_MODEL, "messages": _api_messages(payload), "stream": False}
    try:
        async with httpx.AsyncClient(timeout=config.HERMES_CLI_TIMEOUT) as client:
            resp = await client.post(_api_url(), json=body, headers=_api_headers())
            if resp.status_code != 200:
                return {
                    "text": f"O Hermes (API Server) respondeu {resp.status_code}. O api-server está ativado e na porta certa ({config.HERMES_API_URL})?",
                    "buttons": None,
                    "suggestions": None,
                    "narrate": False,
                }
            data = resp.json()
            content = (((data.get("choices") or [{}])[0]).get("message") or {}).get("content") or ""
            return {"text": content or "Pronto.", "buttons": None, "suggestions": None, "narrate": True}
    except httpx.RequestError:
        # Gateway/api-server fora do ar → rede de segurança: usa o CLI (mais lento,
        # sem passos ao vivo, mas FUNCIONA) em vez de devolver erro pro usuário.
        return await _respond_hermes_cli(payload)
    except Exception as e:  # noqa: BLE001
        return {
            "text": f"Não consegui falar com o Hermes (API Server): {e}.",
            "buttons": None,
            "suggestions": None,
            "narrate": False,
        }


# ---------------------------------------------------------------------------
# Adaptador: Hermes CLI one-shot — `hermes -z "<msg>"` (mesmo cérebro; bom p/ teste)
# ---------------------------------------------------------------------------

# Linhas de log/inicialização que o `hermes -z` imprime antes da resposta real.
# Ex.: "[whatsapp-manager] ✅ Agendador ...", "[plugin] Puxando ... no boot...".
_CLI_NOISE_RE = re.compile(r"^\s*\[[\w .:-]+\]")


def _clean_cli_output(raw: str) -> str:
    """Remove as linhas de log dos plugins, deixando só a resposta do Hermes."""
    kept = [
        line
        for line in raw.splitlines()
        if line.strip() and not _CLI_NOISE_RE.match(line)
    ]
    return "\n".join(kept).strip()


async def _respond_hermes_cli(payload: dict[str, Any]) -> dict[str, Any]:
    args = [config.HERMES_CLI_BIN, "-z", payload["text"]]
    if config.HERMES_CLI_CONTINUE:
        args += ["-c", _session_id(payload.get("user_id"))]
    try:
        proc = await asyncio.create_subprocess_exec(
            *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        out, err = await asyncio.wait_for(proc.communicate(), timeout=config.HERMES_CLI_TIMEOUT)
    except FileNotFoundError:
        return {"text": f"Comando '{config.HERMES_CLI_BIN}' não encontrado no PATH.", "buttons": None, "suggestions": None, "narrate": False}
    except asyncio.TimeoutError:
        return {"text": "O Hermes demorou demais para responder.", "buttons": None, "suggestions": None, "narrate": False}
    if proc.returncode != 0:
        return {"text": f"Erro no Hermes (CLI): {err.decode('utf-8', 'ignore')[:300]}", "buttons": None, "suggestions": None, "narrate": False}
    text = _clean_cli_output(out.decode("utf-8", "ignore"))
    return {"text": text or "Pronto.", "buttons": None, "suggestions": None, "narrate": True}


# ---------------------------------------------------------------------------
# Adaptador: HTTP (seu Hermes expõe um endpoint)
# ---------------------------------------------------------------------------

async def _respond_http(payload: dict[str, Any]) -> dict[str, Any]:
    if not config.HERMES_HTTP_URL:
        return {"text": "HERMES_HTTP_URL não configurada.", "buttons": None, "narrate": False}
    headers = {"Content-Type": "application/json"}
    if config.HERMES_HTTP_AUTH:
        headers["Authorization"] = config.HERMES_HTTP_AUTH
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(config.HERMES_HTTP_URL, headers=headers, json=payload)
        resp.raise_for_status()
        return normalize_reply(resp.json())


# ---------------------------------------------------------------------------
# Adaptador: comando/CLI (seu Hermes é um script; troca JSON por stdin/stdout)
# ---------------------------------------------------------------------------

async def _respond_command(payload: dict[str, Any]) -> dict[str, Any]:
    if not config.HERMES_COMMAND:
        return {"text": "HERMES_COMMAND não configurada.", "buttons": None, "narrate": False}
    proc = await asyncio.create_subprocess_shell(
        config.HERMES_COMMAND,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate(json.dumps(payload).encode("utf-8"))
    if proc.returncode != 0:
        return {"text": f"Erro no Hermes (CLI): {err.decode('utf-8')[:300]}", "buttons": None, "narrate": False}
    text = out.decode("utf-8").strip()
    try:
        return normalize_reply(json.loads(text))
    except json.JSONDecodeError:
        return normalize_reply(text)  # trata a saída como texto puro


# ---------------------------------------------------------------------------
# Adaptador: Python (seu Hermes é um módulo: "pacote.modulo:funcao")
# ---------------------------------------------------------------------------

async def _respond_python(payload: dict[str, Any]) -> dict[str, Any]:
    target = config.HERMES_PYTHON_TARGET
    if not target or ":" not in target:
        return {"text": "HERMES_PYTHON_TARGET inválida (use 'modulo:funcao').", "buttons": None, "narrate": False}
    mod_name, func_name = target.split(":", 1)
    module = importlib.import_module(mod_name)
    func = getattr(module, func_name)
    result = func(payload)
    if asyncio.iscoroutine(result):
        result = await result
    return normalize_reply(result)


# ---------------------------------------------------------------------------
# Adaptador: OpenRouter (default — conversa direto com a IA)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Você é o Hermes, o sistema operacional pessoal de inteligência do Maycon,
acessado pela interface Continental (que substitui o Telegram).
Você é operador, conselheiro e executor: analisa o contexto, toma iniciativa e
recomenda prioridades de forma objetiva e em português do Brasil.

Sempre que precisar de uma DECISÃO ou quiser oferecer caminhos, use a ferramenta
present_options (2 a 4 opções curtas). O texto da opção é o que o usuário enviará
de volta ao tocar. Se o assunto pertence a um projeto (Perfection Airsoft, App Barber,
App Beleza), ofereça uma opção começando com "Abrir projeto: <nome>"."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "present_options",
            "description": "Apresenta uma pergunta com botões de múltipla escolha. Resposta final.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["text", "options"],
            },
        },
    }
]


async def _respond_openrouter(payload: dict[str, Any]) -> dict[str, Any]:
    settings = payload.get("settings") or {}
    model = choose_model(payload.get("project"), settings.get("preferred_model"))

    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in payload.get("history") or []:
        messages.append({"role": "assistant" if m["role"] == "hermes" else "user", "content": m["text"]})
    messages.append({"role": "user", "content": payload["text"]})

    if not config.OPENROUTER_API_KEY:
        return {"text": "OPENROUTER_API_KEY não configurada no backend.", "buttons": None, "narrate": False}

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
                return {"text": f"Não consegui falar com a IA ({resp.status_code}).", "buttons": None, "narrate": False}
            data = resp.json()
    except Exception as e:  # noqa: BLE001
        return {"text": f"Erro ao contatar a IA: {e}", "buttons": None, "narrate": False}

    choice = (data.get("choices") or [{}])[0].get("message", {})
    for call in choice.get("tool_calls") or []:
        if call.get("function", {}).get("name") == "present_options":
            try:
                args = json.loads(call["function"].get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            return {
                "text": args.get("text") or "Escolha uma opção:",
                "buttons": normalize_buttons(args.get("options")),
                "narrate": True,
            }
    return {"text": choice.get("content") or "Pronto.", "buttons": None, "narrate": True}


# ---------------------------------------------------------------------------
# Ponto único de integração
# ---------------------------------------------------------------------------

async def respond(
    text: str,
    history: list[dict[str, Any]],
    settings: dict[str, Any],
    project: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict[str, Any]:
    payload = {
        "text": text,
        "history": history,
        "settings": settings,
        "project": project,
        "user_id": user_id,
    }
    backend = config.HERMES_BACKEND
    if backend == "hermes_api":
        return await _respond_hermes_api(payload)
    if backend == "hermes_cli":
        return await _respond_hermes_cli(payload)
    if backend == "http":
        return await _respond_http(payload)
    if backend == "command":
        return await _respond_command(payload)
    if backend == "python":
        return await _respond_python(payload)
    return await _respond_openrouter(payload)


# ---------------------------------------------------------------------------
# Streaming — "amostragem em tempo real" (estilo Telegram)
# ---------------------------------------------------------------------------
#
# Só o gateway (hermes_api) transmite passos. O parser abaixo é TOLERANTE: aceita
# SSE ("data: {...}") e NDJSON, e reconhece vários formatos de evento. Se o seu
# gateway usar nomes diferentes, ajuste _interpret_sse_event — e mesmo que o
# streaming não funcione, há fallback para a chamada normal (stream=False).

_STEP_TYPES = {"tool", "tool_call", "tool_use", "action", "status", "step", "thinking", "thought", "progress", "log", "reasoning"}
_CONTENT_TYPES = {"token", "delta", "content", "text", "chunk", "message_delta", "response.delta", "output_text.delta"}
_FINAL_TYPES = {"message", "final", "done", "complete", "completed", "response", "result", "answer", "response.completed"}


def _interpret_sse_event(ev: Any) -> tuple[str, Optional[str], Optional[dict[str, Any]]]:
    """Retorna (kind, value, extra). kind: 'step'|'content'|'final'|''."""
    if not isinstance(ev, dict):
        return ("", None, None)

    # Evento de progresso do Hermes (object == "hermes.tool.progress").
    obj = str(ev.get("object") or "").lower()
    if "progress" in obj or "tool" in obj:
        tool = ev.get("tool") or ev.get("name")
        status = ev.get("status") or ev.get("state")
        txt = ev.get("text") or ev.get("message") or ev.get("detail")
        if tool and status:
            return ("step", f"{tool} · {status}", None)
        return ("step", str(txt or tool or "executando…").strip(), None)

    # OpenAI-compatível (choices[].delta.content)
    choices = ev.get("choices")
    if isinstance(choices, list) and choices:
        ch = choices[0] or {}
        delta = ch.get("delta") or {}
        if isinstance(delta, dict) and isinstance(delta.get("content"), str):
            return ("content", delta["content"], None)
        msg = ch.get("message") or {}
        if isinstance(msg, dict) and isinstance(msg.get("content"), str) and ch.get("finish_reason"):
            return ("final", msg["content"], None)

    t = str(ev.get("type") or ev.get("event") or "").lower()
    if t in _STEP_TYPES:
        val = (
            ev.get("name") or ev.get("tool") or ev.get("text") or ev.get("message")
            or ev.get("status") or ev.get("content") or ev.get("detail")
        )
        return ("step", str(val).strip() if val else "", None)
    if t in _CONTENT_TYPES:
        val = ev.get("content") or ev.get("text") or ev.get("delta") or ev.get("token") or ev.get("value")
        if isinstance(val, str):
            return ("content", val, None)
    if t in _FINAL_TYPES:
        val = ev.get("text") or ev.get("content") or ev.get("message") or ev.get("reply") or ev.get("answer")
        return ("final", str(val) if val else None, ev)

    # Fallback: campos soltos de conteúdo.
    if isinstance(ev.get("content"), str):
        return ("content", ev["content"], None)
    if isinstance(ev.get("text"), str):
        return ("content", ev["text"], None)
    return ("", None, None)


async def _respond_hermes_api_stream(payload: dict[str, Any]):
    """Gera eventos {'type': 'step'|'partial'|'final', ...} a partir do gateway.
    Endpoint OpenAI-compatível: chunks `chat.completion.chunk` (texto) +
    eventos `hermes.tool.progress` (o que o agente está fazendo)."""
    body = {"model": config.HERMES_API_MODEL, "messages": _api_messages(payload), "stream": True}
    headers = {**_api_headers(), "Accept": "text/event-stream"}
    text_acc = ""
    final_obj: Optional[dict[str, Any]] = None
    produced = False

    try:
        async with httpx.AsyncClient(timeout=config.HERMES_CLI_TIMEOUT) as client:
            async with client.stream("POST", _api_url(), json=body, headers=headers) as resp:
                if resp.status_code == 200:
                    async for raw in resp.aiter_lines():
                        line = (raw or "").strip()
                        if not line:
                            continue
                        data = line[5:].strip() if line.startswith("data:") else line
                        if data == "[DONE]":
                            break
                        try:
                            ev = json.loads(data)
                        except json.JSONDecodeError:
                            text_acc += data  # token de texto puro
                            produced = True
                            yield {"type": "partial", "text": text_acc}
                            continue
                        kind, value, extra = _interpret_sse_event(ev)
                        if kind == "step" and value:
                            produced = True
                            yield {"type": "step", "text": value}
                        elif kind == "content" and value:
                            text_acc += value
                            produced = True
                            yield {"type": "partial", "text": text_acc}
                        elif kind == "final":
                            produced = True
                            final_obj = extra or {}
                            if value:
                                text_acc = value
    except Exception:  # noqa: BLE001
        produced = False

    if not produced and not text_acc:
        # Gateway não transmitiu (ou falhou) → usa o caminho normal (funciona).
        result = await _respond_hermes_api(payload)
        yield {"type": "final", **result}
        return

    text = (final_obj or {}).get("text") if final_obj else None
    text = text or text_acc or "Pronto."
    buttons = None
    if final_obj:
        buttons = normalize_buttons(final_obj.get("buttons") or final_obj.get("options"))
    yield {"type": "final", "text": text, "buttons": buttons, "suggestions": None, "narrate": True}


async def respond_stream(
    text: str,
    history: list[dict[str, Any]],
    settings: dict[str, Any],
    project: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """Versão streaming de respond(). Só hermes_api transmite passos; os demais
    backends emitem um único evento 'final' (comportamento idêntico ao anterior)."""
    if config.HERMES_BACKEND == "hermes_api":
        payload = {"text": text, "history": history, "settings": settings, "project": project, "user_id": user_id}
        async for ev in _respond_hermes_api_stream(payload):
            yield ev
        return
    result = await respond(text, history, settings, project=project, user_id=user_id)
    yield {"type": "final", **result}
