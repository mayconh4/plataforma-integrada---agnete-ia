"""Acesso ao Supabase via REST (PostgREST) usando a service_role key.

Mantém a persistência de mensagens/contexto. O Continental usa o Supabase
apenas como banco; o "cérebro" é o Hermes (este backend), não uma Edge Function.
"""
from typing import Any, Optional

import httpx

from . import config


def _rest_headers() -> dict[str, str]:
    return {
        "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def verify_user(access_token: str) -> Optional[dict[str, Any]]:
    """Valida o JWT do usuário (Supabase Auth) e retorna o usuário, ou None.

    O `apikey` precisa ser uma chave de projeto válida; o `Authorization` Bearer
    é o token do usuário (é ele que identifica quem está logado). Tentamos a
    chave secreta primeiro porque a chave anon LEGADA (eyJ...) costuma ficar
    DESATIVADA quando o projeto migra para o novo sistema (sb_publishable_/
    sb_secret_) — e aí a validação com a anon retorna 401 e o app não conecta.
    """
    if not access_token:
        return None
    url = f"{config.SUPABASE_URL}/auth/v1/user"
    for api_key in (config.SUPABASE_SERVICE_ROLE_KEY, config.SUPABASE_ANON_KEY):
        if not api_key:
            continue
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    url, headers={"apikey": api_key, "Authorization": f"Bearer {access_token}"}
                )
            if resp.status_code == 200:
                return resp.json()
        except Exception:  # noqa: BLE001
            continue
    return None


async def insert_message(
    user_id: str,
    role: str,
    text: str,
    buttons: Optional[list[dict[str, Any]]] = None,
    suggestions: Optional[list[str]] = None,
    narrate: bool = True,
) -> dict[str, Any]:
    url = f"{config.SUPABASE_URL}/rest/v1/messages"
    payload = {
        "user_id": user_id,
        "role": role,
        "text": text,
        "buttons": buttons,
        "suggestions": suggestions,
        "narrate": narrate,
    }
    headers = {**_rest_headers(), "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()[0]


async def recent_messages(user_id: str, limit: int = 16) -> list[dict[str, Any]]:
    url = f"{config.SUPABASE_URL}/rest/v1/messages"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "role,text",
        "order": "created_at.desc",
        "limit": str(limit),
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers=_rest_headers(), params=params)
        resp.raise_for_status()
        return list(reversed(resp.json()))


async def get_settings(user_id: str) -> dict[str, Any]:
    url = f"{config.SUPABASE_URL}/rest/v1/settings"
    params = {"user_id": f"eq.{user_id}", "select": "*", "limit": "1"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers=_rest_headers(), params=params)
        if resp.status_code == 200 and resp.json():
            return resp.json()[0]
    return {"preferred_model": "claude", "voice_enabled": True}
