"""Continental — backend FastAPI.

Expõe um WebSocket que conecta o app (celular) ao Hermes (este processo, local).
Fluxo: app -> WS -> Hermes processa (escolhe modelo, responde) -> volta pelo WS.
A persistência é no Supabase. Exponha para o celular com Cloudflare Tunnel.
"""
import asyncio
import io
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from . import config, hermes, supabase_store

app = FastAPI(title="Continental / Hermes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "continental-hermes"}


async def _edge_tts(text: str, voice: str) -> bytes:
    """Voz neural do Microsoft Edge (melhor qualidade)."""
    import edge_tts

    audio = bytearray()
    async for chunk in edge_tts.Communicate(text, voice).stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise RuntimeError("edge-tts retornou vazio")
    return bytes(audio)


async def _gtts(text: str) -> bytes:
    """Fallback: voz do Google Tradutor (natural e muito estável)."""
    from gtts import gTTS

    def _gen() -> bytes:
        buf = io.BytesIO()
        gTTS(text=text, lang="pt", tld="com.br").write_to_fp(buf)
        return buf.getvalue()

    audio = await asyncio.to_thread(_gen)
    if not audio:
        raise RuntimeError("gTTS retornou vazio")
    return audio


@app.get("/tts")
async def tts(text: str = "", voice: str = config.TTS_VOICE):
    """Devolve um MP3 com a resposta narrada (voz natural).

    Tenta primeiro a voz neural do Edge (edge-tts). Se falhar por qualquer
    motivo no PC do usuário (rede, bloqueio, etc.), cai para a voz do Google
    (gTTS). Só devolve erro legível (HTTP 500 JSON) se as duas falharem.
    """
    clean = (text or "").strip()[: config.TTS_MAX_CHARS] or "."

    try:
        return Response(content=await _edge_tts(clean, voice), media_type="audio/mpeg")
    except Exception as edge_err:  # noqa: BLE001
        edge_detail = f"{type(edge_err).__name__}: {edge_err}"

    try:
        return Response(content=await _gtts(clean), media_type="audio/mpeg")
    except Exception as gtts_err:  # noqa: BLE001
        gtts_detail = f"{type(gtts_err).__name__}: {gtts_err}"

    return JSONResponse(
        status_code=500,
        content={"error": "tts_failed", "edge": edge_detail[:300], "gtts": gtts_detail[:300]},
    )


async def _send(ws: WebSocket, payload: dict) -> None:
    await ws.send_text(json.dumps(payload, ensure_ascii=False))


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    # Autenticação: token JWT do Supabase via query string (?token=...)
    token = ws.query_params.get("token", "")
    user = await supabase_store.verify_user(token)
    if not user:
        await ws.close(code=4401)  # não autorizado
        return

    user_id = user["id"]
    await ws.accept()
    await _send(ws, {"type": "ready", "user": {"id": user_id, "email": user.get("email")}})

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if msg.get("type") != "user_message":
                continue

            text = (msg.get("text") or "").strip()
            project = msg.get("project")  # opcional: contexto de projeto
            if not text:
                continue

            # Persiste a mensagem do usuário.
            await supabase_store.insert_message(user_id, "user", text, narrate=False)

            # Sinaliza que o Hermes está "pensando".
            await _send(ws, {"type": "thinking"})

            history = await supabase_store.recent_messages(user_id)
            settings = await supabase_store.get_settings(user_id)

            # Transmite os passos em tempo real (estilo Telegram) e captura o final.
            reply: dict | None = None
            async for ev in hermes.respond_stream(text, history, settings, project=project, user_id=user_id):
                etype = ev.get("type")
                if etype == "step":
                    await _send(ws, {"type": "step", "text": ev.get("text", "")})
                elif etype == "partial":
                    await _send(ws, {"type": "partial", "text": ev.get("text", "")})
                elif etype == "final":
                    reply = ev
            if reply is None:
                reply = {"text": "Pronto.", "buttons": None, "suggestions": None, "narrate": True}

            row = await supabase_store.insert_message(
                user_id,
                "hermes",
                reply["text"],
                buttons=reply.get("buttons"),
                suggestions=reply.get("suggestions"),
                narrate=reply.get("narrate", True),
            )

            await _send(
                ws,
                {
                    "type": "message",
                    "message": {
                        "id": row["id"],
                        "role": "hermes",
                        "text": row["text"],
                        "buttons": row.get("buttons"),
                        "suggestions": row.get("suggestions"),
                        "narrate": row.get("narrate", True),
                        "created_at": row["created_at"],
                    },
                },
            )
    except WebSocketDisconnect:
        return
