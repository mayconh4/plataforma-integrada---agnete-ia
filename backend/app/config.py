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

# Servidor
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
