"""Configuração via variáveis de ambiente (.env)."""
import os

from dotenv import load_dotenv

load_dotenv()


def _req(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        print(f"[config] AVISO: variável {name} não definida")
    return value


# Supabase
SUPABASE_URL = _req("SUPABASE_URL").rstrip("/")
SUPABASE_ANON_KEY = _req("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = _req("SUPABASE_SERVICE_ROLE_KEY")

# OpenRouter (gateway de modelos)
OPENROUTER_API_KEY = _req("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- Onde está o "cérebro" do Hermes ---
# "hermes_cli" (default): fala com o Hermes Agent em one-shot (`hermes -z "<msg>"`).
#               MESMO cérebro do Telegram (tools, skills, memória); o Hermes decide
#               o modelo. Funciona em qualquer instalação do Hermes via CLI.
# "hermes_api": fala com o Hermes via gateway HTTP (POST /chat) — exige um gateway
#               rodando que exponha esse endpoint.
# "http":     chama um Hermes próprio por HTTP (HERMES_HTTP_URL).
# "command":  executa um script/CLI próprio (HERMES_COMMAND), JSON via stdin/stdout.
# "python":   importa e chama uma função (HERMES_PYTHON_TARGET, ex.: "meu_hermes:responder").
# "openrouter": fallback — este backend conversa direto com a IA via OpenRouter.
HERMES_BACKEND = os.environ.get("HERMES_BACKEND", "hermes_cli").strip().lower()

# (hermes_api) URL base do gateway API Server do Hermes.
HERMES_API_URL = os.environ.get("HERMES_API_URL", "http://localhost:8080").strip().rstrip("/")
HERMES_HTTP_URL = os.environ.get("HERMES_HTTP_URL", "").strip()
HERMES_HTTP_AUTH = os.environ.get("HERMES_HTTP_AUTH", "").strip()  # valor do header Authorization (opcional)
HERMES_COMMAND = os.environ.get("HERMES_COMMAND", "").strip()
HERMES_PYTHON_TARGET = os.environ.get("HERMES_PYTHON_TARGET", "").strip()

# (hermes_cli) Hermes Agent em one-shot: `hermes -z "<msg>"`
HERMES_CLI_BIN = os.environ.get("HERMES_CLI_BIN", "hermes").strip()
# Continuidade por usuário (resume a sessão por título). "1" liga.
HERMES_CLI_CONTINUE = os.environ.get("HERMES_CLI_CONTINUE", "0").strip() == "1"
HERMES_CLI_SESSION_PREFIX = os.environ.get("HERMES_CLI_SESSION_PREFIX", "continental").strip()
# Timeout (s) — o agente tem tools, pode demorar.
HERMES_CLI_TIMEOUT = int(os.environ.get("HERMES_CLI_TIMEOUT", "180"))

# Servidor
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))

# TTS (voz neural via edge-tts — vozes do Microsoft Edge, grátis).
# Vozes pt-BR comuns: pt-BR-AntonioNeural (masc.), pt-BR-FranciscaNeural (fem.),
# pt-BR-ThalitaNeural (fem.). Veja `edge-tts --list-voices`.
TTS_VOICE = os.environ.get("TTS_VOICE", "pt-BR-FranciscaNeural").strip()
TTS_MAX_CHARS = int(os.environ.get("TTS_MAX_CHARS", "2000"))
