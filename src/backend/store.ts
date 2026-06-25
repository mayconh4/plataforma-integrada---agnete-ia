import { AppState } from 'react-native';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from '../types/chat';
import { Settings } from './types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  ConnStatus,
  IncomingMessage,
  configure as configureConn,
  connect as connectWs,
  disconnect as disconnectWs,
  effectiveWsUrl,
  hasWsUrl,
  send as wsSend,
} from './connection';
import { loadWsUrl, saveWsUrl } from '../lib/serverConfig';
import { DEFAULT_VOICE, getCachedVoice, loadVoice, saveVoice } from '../lib/voicePref';

// ---------------------------------------------------------------------------
// Estado da UI
// ---------------------------------------------------------------------------

export interface HermesUiState {
  configured: boolean; // supabase + url do hermes
  ready: boolean; // sessão verificada
  session: Session | null;
  authError: string | null;
  status: ConnStatus; // conexão com o Hermes
  thinking: boolean; // Hermes processando
  liveStatus: string; // "o que está sendo feito" em tempo real
  messages: ChatMessage[];
  settings: Settings;
  activeProject: string | null; // projeto aberto (navegação)
  wsUrl: string; // URL atual do Hermes (runtime)
  voice: string; // voz escolhida para a narração (runtime)
}

const defaultSettings: Settings = { voiceEnabled: true, preferredModel: 'claude' };

let state: HermesUiState = {
  configured: isSupabaseConfigured,
  ready: false,
  session: null,
  authError: null,
  status: 'idle',
  thinking: false,
  liveStatus: '',
  messages: [],
  settings: defaultSettings,
  activeProject: null,
  wsUrl: '',
  voice: DEFAULT_VOICE,
};

const listeners = new Set<() => void>();
let initialized = false;
let connectedUserId: string | null = null;
let messagesChannel: RealtimeChannel | null = null;

function set(partial: Partial<HermesUiState>): void {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function getState(): HermesUiState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let idCounter = 0;
function localId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toMessage(r: any): ChatMessage {
  return {
    id: r.id,
    role: r.role,
    text: r.text,
    timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    buttons: r.buttons ?? undefined,
    suggestions: r.suggestions ?? undefined,
    narrate: r.narrate ?? false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Adiciona uma mensagem, ignorando duplicatas por id (idempotente). */
function appendMessage(msg: ChatMessage): void {
  if (state.messages.some((m) => m.id === msg.id)) return;
  set({ messages: [...state.messages, msg] });
}

/**
 * Trata uma mensagem vinda do Supabase Realtime. Reconcilia a bolha otimista do
 * usuário (id local) com a linha persistida (id do servidor) para não duplicar.
 */
function handleInserted(row: unknown): void {
  const msg = toMessage(row);
  if (!msg.id || !msg.text) return;

  if (msg.role === 'user') {
    const idx = state.messages.findIndex((m) => m.id.startsWith('user_') && m.text === msg.text);
    if (idx >= 0) {
      const copy = [...state.messages];
      copy[idx] = { ...copy[idx], id: msg.id, timestamp: msg.timestamp };
      set({ messages: copy });
      return;
    }
  }

  appendMessage(msg);
  if (msg.role === 'hermes') set({ thinking: false, liveStatus: '' });
}

// ---------------------------------------------------------------------------
// Conexão com o Hermes (WebSocket)
// ---------------------------------------------------------------------------

configureConn({
  onStatus: (s) => set({ status: s }),
  onThinking: () => set({ thinking: true, liveStatus: 'Pensando…' }),
  onStep: (text) => set({ thinking: true, liveStatus: text }),
  onReady: () => {
    // Reconectou: o app pode ter perdido respostas enquanto esteve fechado.
    void refreshHistory();
  },
  onMessage: (m: IncomingMessage) => {
    set({ thinking: false, liveStatus: '' });
    appendMessage(toMessage(m));
  },
});

async function fetchHistory(userId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200);
  return (data ?? []).map(toMessage);
}

async function loadHistory(userId: string): Promise<void> {
  set({ messages: await fetchHistory(userId) });
}

/**
 * Recarrega o histórico do Supabase (fonte da verdade) preservando as bolhas
 * otimistas locais ainda não persistidas. Chamado ao voltar pro app e ao
 * reconectar — é o que faz a resposta reaparecer mesmo se você fechou o app.
 */
export async function refreshHistory(): Promise<void> {
  const userId = state.session?.user.id;
  if (!userId) return;
  const server = await fetchHistory(userId);
  const pending = state.messages.filter(
    (m) => (m.id.startsWith('user_') || m.id.startsWith('err_')) && !server.some((s) => s.role === m.role && s.text === m.text),
  );
  set({ messages: [...server, ...pending], thinking: false, liveStatus: '' });
}

/** Assina o Supabase Realtime para receber novas mensagens ao vivo. */
function subscribeMessages(userId: string): void {
  if (messagesChannel) {
    void supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  messagesChannel = supabase
    .channel(`messages-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => handleInserted(payload.new),
    )
    .subscribe();
}

function unsubscribeMessages(): void {
  if (messagesChannel) {
    void supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
}

async function loadSettings(userId: string): Promise<void> {
  const { data } = await supabase.from('settings').select('*').eq('user_id', userId).single();
  if (data) set({ settings: { voiceEnabled: data.voice_enabled, preferredModel: data.preferred_model } });
}

async function onSession(session: Session | null): Promise<void> {
  set({ session, authError: null });
  const userId = session?.user.id ?? null;

  if (userId && userId !== connectedUserId) {
    connectedUserId = userId;
    await Promise.all([loadHistory(userId), loadSettings(userId)]);
    subscribeMessages(userId);
    if (hasWsUrl()) connectWs(session!.access_token);
    else set({ status: 'offline' });
  } else if (!userId && connectedUserId) {
    connectedUserId = null;
    unsubscribeMessages();
    disconnectWs();
    set({ messages: [], settings: defaultSettings, status: 'idle', activeProject: null, liveStatus: '' });
  }
}

/** Verifica a sessão e conecta ao Hermes. Idempotente. */
export async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await loadVoice();
  set({ voice: getCachedVoice() });

  // Ao voltar pro app, recarrega o histórico (pega respostas que chegaram fechado).
  AppState.addEventListener('change', (s) => {
    if (s === 'active') void refreshHistory();
  });

  if (!state.configured) {
    set({ ready: true });
    return;
  }

  await loadWsUrl();
  set({ wsUrl: effectiveWsUrl() });

  const { data } = await supabase.auth.getSession();
  await onSession(data.session);
  set({ ready: true });

  supabase.auth.onAuthStateChange((_event, session) => {
    void onSession(session);
  });
}

/** Define/atualiza a URL do Hermes (salva no aparelho) e reconecta. */
export async function setServerUrl(url: string): Promise<void> {
  await saveWsUrl(url);
  set({ wsUrl: effectiveWsUrl() });
  if (state.session && hasWsUrl()) {
    connectWs(state.session.access_token);
  }
}

/** Define/atualiza a voz da narração (salva no aparelho). */
export async function setVoice(voiceId: string): Promise<void> {
  await saveVoice(voiceId);
  set({ voice: getCachedVoice() });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<void> {
  set({ authError: null });
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) set({ authError: traduzErro(error.message) });
}

export async function signUp(email: string, password: string): Promise<void> {
  set({ authError: null });
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) {
    set({ authError: traduzErro(error.message) });
    return;
  }
  if (!data.session) {
    set({
      authError:
        'Conta criada. Se a confirmação por e-mail estiver ativa, confirme antes de entrar (ou desative em Auth → Providers).',
    });
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(msg)) return 'Este e-mail já está cadastrado.';
  if (/password should be at least/i.test(msg)) return 'A senha é muito curta (mínimo 6 caracteres).';
  return msg;
}

// ---------------------------------------------------------------------------
// Interação com o Hermes
// ---------------------------------------------------------------------------

/** Envia uma mensagem ao Hermes pelo WebSocket. Mostra a bolha do usuário na hora. */
export function sendMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage({ id: localId('user'), role: 'user', text: trimmed, timestamp: Date.now() });

  const ok = wsSend({ type: 'user_message', text: trimmed, project: state.activeProject });
  if (ok) {
    set({ thinking: true, liveStatus: 'Pensando…' });
  } else {
    appendMessage({
      id: localId('err'),
      role: 'hermes',
      text: 'Sem conexão com o Hermes agora. Verifique se o servidor está rodando e tente de novo.',
      timestamp: Date.now(),
      narrate: false,
    });
  }
}

/** Chip de sugestão = mensagem de texto. */
export function pressSuggestion(text: string): void {
  sendMessage(text);
}

// ---------------------------------------------------------------------------
// Navegação de projetos
// ---------------------------------------------------------------------------

export function openProject(name: string): void {
  set({ activeProject: name });
}

export function closeProject(): void {
  set({ activeProject: null });
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

export async function setVoiceEnabled(enabled: boolean): Promise<void> {
  set({ settings: { ...state.settings, voiceEnabled: enabled } });
  if (state.session) {
    await supabase
      .from('settings')
      .update({ voice_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', state.session.user.id);
  }
}
