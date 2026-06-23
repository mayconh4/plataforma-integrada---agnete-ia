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
# "openrouter" (default): este backend conversa direto com a IA via OpenRouter.
# "http":    chama o SEU Hermes local por HTTP (HERMES_HTTP_URL).
# "command": executa o SEU Hermes como script/CLI (HERMES_COMMAND), JSON via stdin/stdout.
# "python":  importa e chama uma função do SEU Hermes (HERMES_PYTHON_TARGET, ex.: "meu_hermes:responder").
HERMES_BACKEND = os.environ.get("HERMES_BACKEND", "openrouter").strip().lower()
HERMES_HTTP_URL = os.environ.get("HERMES_HTTP_URL", "").strip()
HERMES_HTTP_AUTH = os.environ.get("HERMES_HTTP_AUTH", "").strip()  # valor do header Authorization (opcional)
HERMES_COMMAND = os.environ.get("HERMES_COMMAND", "").strip()
HERMES_PYTHON_TARGET = os.environ.get("HERMES_PYTHON_TARGET", "").strip()

# Servidor
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
