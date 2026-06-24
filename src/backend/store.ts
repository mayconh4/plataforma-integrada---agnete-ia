import type { Session } from '@supabase/supabase-js';
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
  messages: ChatMessage[];
  settings: Settings;
  activeProject: string | null; // projeto aberto (navegação)
  wsUrl: string; // URL atual do Hermes (runtime)
}

const defaultSettings: Settings = { voiceEnabled: true, preferredModel: 'claude' };

let state: HermesUiState = {
  configured: isSupabaseConfigured, // a URL do Hermes pode ser definida no app
  ready: false,
  session: null,
  authError: null,
  status: 'idle',
  thinking: false,
  messages: [],
  settings: defaultSettings,
  activeProject: null,
  wsUrl: '',
};

const listeners = new Set<() => void>();
let initialized = false;
let connectedUserId: string | null = null;

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

function appendMessage(msg: ChatMessage): void {
  set({ messages: [...state.messages, msg] });
}

// ---------------------------------------------------------------------------
// Conexão com o Hermes (WebSocket)
// ---------------------------------------------------------------------------

configureConn({
  onStatus: (s) => set({ status: s }),
  onThinking: () => set({ thinking: true }),
  onMessage: (m: IncomingMessage) => {
    set({ thinking: false });
    appendMessage(toMessage(m));
  },
});

async function loadHistory(userId: string): Promise<void> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200);
  set({ messages: (data ?? []).map(toMessage) });
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
    if (hasWsUrl()) connectWs(session!.access_token);
    else set({ status: 'offline' });
  } else if (!userId && connectedUserId) {
    connectedUserId = null;
    disconnectWs();
    set({ messages: [], settings: defaultSettings, status: 'idle', activeProject: null });
  }
}

/** Verifica a sessão e conecta ao Hermes. Idempotente. */
export async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

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
    set({ thinking: true });
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
