// Cliente WebSocket que conecta o app ao Hermes (backend FastAPI, via Cloudflare Tunnel).

export const HERMES_WS_URL = process.env.EXPO_PUBLIC_HERMES_WS_URL ?? '';
export const isHermesConfigured = HERMES_WS_URL.length > 0;

export type ConnStatus = 'idle' | 'connecting' | 'online' | 'offline';

export interface IncomingMessage {
  id: string;
  role: 'hermes';
  text: string;
  buttons?: unknown;
  narrate?: boolean;
  created_at: string;
}

interface Handlers {
  onStatus: (s: ConnStatus) => void;
  onThinking: () => void;
  onMessage: (m: IncomingMessage) => void;
}

let ws: WebSocket | null = null;
let handlers: Handlers | null = null;
let token: string | null = null;
let shouldRun = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function configure(h: Handlers): void {
  handlers = h;
}

function open(): void {
  if (!HERMES_WS_URL || !token) return;
  handlers?.onStatus('connecting');
  const socket = new WebSocket(`${HERMES_WS_URL}?token=${encodeURIComponent(token)}`);
  ws = socket;

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string);
      if (payload.type === 'ready') handlers?.onStatus('online');
      else if (payload.type === 'thinking') handlers?.onThinking();
      else if (payload.type === 'message' && payload.message) handlers?.onMessage(payload.message);
    } catch {
      // ignora frames inválidos
    }
  };

  socket.onclose = () => {
    if (ws === socket) ws = null;
    handlers?.onStatus('offline');
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket.close();
  };
}

function scheduleReconnect(): void {
  if (!shouldRun || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shouldRun) open();
  }, 2500);
}

export function connect(accessToken: string): void {
  token = accessToken;
  shouldRun = true;
  if (ws) ws.close();
  open();
}

export function send(obj: Record<string, unknown>): boolean {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

export function disconnect(): void {
  shouldRun = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
