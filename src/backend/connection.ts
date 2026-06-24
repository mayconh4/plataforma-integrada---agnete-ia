// Cliente WebSocket que conecta o app ao Hermes (backend FastAPI, via Cloudflare Tunnel).
import { getCachedWsUrl } from '../lib/serverConfig';

// URL embutida no build (.env). Pode ser sobrescrita em runtime (serverConfig).
export const ENV_WS_URL = process.env.EXPO_PUBLIC_HERMES_WS_URL ?? '';

export function effectiveWsUrl(): string {
  return (getCachedWsUrl() || ENV_WS_URL).trim();
}

export function hasWsUrl(): boolean {
  return effectiveWsUrl().length > 0;
}

export type ConnStatus = 'idle' | 'connecting' | 'online' | 'offline';

export interface IncomingMessage {
  id: string;
  role: 'hermes';
  text: string;
  buttons?: unknown;
  suggestions?: unknown;
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
  const url = effectiveWsUrl();
  if (!url || !token) {
    handlers?.onStatus('offline');
    return;
  }
  handlers?.onStatus('connecting');
  const socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
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
