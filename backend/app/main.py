"""Continental — backend FastAPI.

Expõe um WebSocket que conecta o app (celular) ao Hermes (este processo, local).
Fluxo: app -> WS -> Hermes processa (escolhe modelo, responde) -> volta pelo WS.
A persistência é no Supabase. Exponha para o celular com Cloudflare Tunnel.
"""
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


@app.get("/tts")
async def tts(text: str = "", voice: str = config.TTS_VOICE):
    """Gera áudio neural (vozes do Microsoft Edge, grátis) e devolve um MP3.

    O app chama este endpoint para narrar as respostas do Hermes com voz natural.
    Gera o áudio completo antes de responder: assim, se o edge-tts falhar,
    devolvemos um erro legível (HTTP 500 JSON) em vez de uma resposta quebrada.
    """
    import edge_tts

    clean = (text or "").strip()[: config.TTS_MAX_CHARS] or "."
    try:
        audio = bytearray()
        communicate = edge_tts.Communicate(clean, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
        if not audio:
            raise RuntimeError("edge-tts não retornou áudio (verifique a voz/conexão)")
        return Response(content=bytes(audio), media_type="audio/mpeg")
    except Exception as e:  # noqa: BLE001
        return JSONResponse(
            status_code=500,
            content={"error": type(e).__name__, "detail": str(e)[:400], "voice": voice},
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
            reply = await hermes.respond(text, history, settings, project=project, user_id=user_id)

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
