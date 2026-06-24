"""Teste de integração do proxy Continental com um Hermes API Server FALSO.

Sobe um mock de POST /chat, faz monkeypatch do Supabase (auth + insert) e
exercita o caminho completo: WebSocket /ws -> respond() -> hermes_api -> mock.
Não toca no Supabase nem no Hermes reais.
"""
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# Configura o backend ANTES de importar a app (config lê env no import).
os.environ["HERMES_BACKEND"] = "hermes_api"
os.environ["HERMES_API_URL"] = "http://127.0.0.1:8099"
os.environ["SUPABASE_URL"] = "http://localhost:9"  # dummy (não será chamado)
os.environ["SUPABASE_ANON_KEY"] = "x"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "x"

# --- Mock do Hermes API Server ---
RECEIVED = {}


class MockHermes(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        RECEIVED.update(body)
        reply = {
            "text": f"Recebi: '{body.get('message')}'. Hoje você tem 2 prioridades.",
            "buttons": ["Ver agenda", "Resolver campanha Perfection"],
            "suggestions": ["Status do sistema"],
            "narrate": True,
        }
        data = json.dumps(reply).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


server = HTTPServer(("127.0.0.1", 8099), MockHermes)
threading.Thread(target=server.serve_forever, daemon=True).start()

# --- Importa a app e faz monkeypatch do Supabase ---
from app import main, supabase_store  # noqa: E402


async def fake_verify_user(token):
    return {"id": "user-test-123", "email": "maycon@teste.com"} if token else None


_inserted = []


async def fake_insert_message(user_id, role, text, buttons=None, suggestions=None, narrate=True):
    row = {
        "id": f"row-{len(_inserted)}",
        "role": role,
        "text": text,
        "buttons": buttons,
        "suggestions": suggestions,
        "narrate": narrate,
        "created_at": "2026-06-24T12:00:00Z",
    }
    _inserted.append(row)
    return row


async def fake_recent_messages(user_id, limit=16):
    return []


async def fake_get_settings(user_id):
    return {"preferred_model": "claude", "voice_enabled": True}


supabase_store.verify_user = fake_verify_user
supabase_store.insert_message = fake_insert_message
supabase_store.recent_messages = fake_recent_messages
supabase_store.get_settings = fake_get_settings

# --- Exercita o WebSocket ---
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(main.app)

print("== /health ==")
print(client.get("/health").json())

print("\n== WebSocket /ws ==")
with client.websocket_connect("/ws?token=abc") as ws:
    print("recv:", ws.receive_json())  # ready
    ws.send_json({"type": "user_message", "text": "O que temos pra hoje?"})
    print("recv:", ws.receive_json())  # thinking
    msg = ws.receive_json()  # message
    print("recv:", json.dumps(msg, ensure_ascii=False, indent=2))

print("\n== Verificações ==")
assert RECEIVED.get("message") == "O que temos pra hoje?", "mock não recebeu a mensagem"
assert RECEIVED.get("session_id") == "continental-user-test-123", "session_id por usuário errado"
assert msg["type"] == "message"
assert "2 prioridades" in msg["message"]["text"]
assert [b["label"] for b in msg["message"]["buttons"]] == ["Ver agenda", "Resolver campanha Perfection"]
assert msg["message"]["suggestions"] == ["Status do sistema"]
assert msg["message"]["narrate"] is True
print("session_id enviado ao Hermes:", RECEIVED.get("session_id"))
print("\n✅ TODAS AS VERIFICAÇÕES PASSARAM")
server.shutdown()
