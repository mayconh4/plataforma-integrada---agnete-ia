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

/** Converte a URL WebSocket (wss://host/ws) na base HTTP (https://host) para chamar /tts, /health etc. */
export function httpBaseUrl(): string {
  const ws = effectiveWsUrl();
  if (!ws) return '';
  return ws
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/ws\/?$/i, '');
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
  /** Progresso em tempo real ("o que está sendo feito"), quando o backend envia. */
  onStep?: (text: string) => void;
  /** Texto da resposta sendo formado (acumulado), quando o backend transmite. */
  onPartial?: (text: string) => void;
  /** Conectou/reconectou (sinal para recarregar o histórico do Supabase). */
  onReady?: () => void;
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
      if (payload.type === 'ready') {
        handlers?.onStatus('online');
        handlers?.onReady?.();
      } else if (payload.type === 'thinking') {
        handlers?.onThinking();
      } else if (payload.type === 'step' || payload.type === 'status' || payload.type === 'progress' || payload.type === 'tool') {
        const t = payload.text ?? payload.message ?? payload.detail;
        if (typeof t === 'string' && t.trim()) handlers?.onStep?.(t.trim());
      } else if (payload.type === 'partial') {
        const t = payload.text ?? payload.message;
        if (typeof t === 'string') handlers?.onPartial?.(t);
      } else if (payload.type === 'message' && payload.message) {
        handlers?.onMessage(payload.message);
      }
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
