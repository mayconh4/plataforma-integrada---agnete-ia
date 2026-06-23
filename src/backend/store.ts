import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { ChatMessage } from '../types/chat';
import { Automation, Settings, Task } from './types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Estado da UI (espelha o backend Supabase + sessão de auth)
// ---------------------------------------------------------------------------

export interface HermesUiState {
  configured: boolean;
  ready: boolean; // sessão já verificada
  loading: boolean; // carregando dados do usuário
  sending: boolean; // aguardando resposta da IA
  session: Session | null;
  authError: string | null;
  messages: ChatMessage[];
  tasks: Task[];
  automations: Automation[];
  settings: Settings;
}

const defaultSettings: Settings = { voiceEnabled: true, preferredModel: 'claude' };

let state: HermesUiState = {
  configured: isSupabaseConfigured,
  ready: false,
  loading: false,
  sending: false,
  session: null,
  authError: null,
  messages: [],
  tasks: [],
  automations: [],
  settings: defaultSettings,
};

const listeners = new Set<() => void>();
let initialized = false;
let channel: RealtimeChannel | null = null;
let loadedUserId: string | null = null;

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

// ---------------------------------------------------------------------------
// Mapeamento linha do banco -> tipos do app
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function toMessage(r: any): ChatMessage {
  return {
    id: r.id,
    role: r.role,
    text: r.text,
    timestamp: new Date(r.created_at).getTime(),
    buttons: r.buttons ?? undefined,
    suggestions: r.suggestions ?? undefined,
    narrate: r.narrate ?? false,
  };
}

function toTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    priority: r.priority,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
    deferUntil: r.defer_until ? new Date(r.defer_until).getTime() : undefined,
  };
}

function toAutomation(r: any): Automation {
  return {
    id: r.id,
    name: r.name,
    trigger: r.trigger,
    enabled: r.enabled,
    runs: r.runs,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function toSettings(r: any): Settings {
  return { voiceEnabled: r.voice_enabled, preferredModel: r.preferred_model };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function sortMessages(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => a.timestamp - b.timestamp);
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
}

// ---------------------------------------------------------------------------
// Carga inicial + realtime
// ---------------------------------------------------------------------------

async function loadData(userId: string): Promise<void> {
  set({ loading: true });
  const [msgs, tasks, autos, settings] = await Promise.all([
    supabase.from('messages').select('*').order('created_at', { ascending: true }),
    supabase.from('tasks').select('*').order('created_at', { ascending: true }),
    supabase.from('automations').select('*').order('created_at', { ascending: true }),
    supabase.from('settings').select('*').eq('user_id', userId).single(),
  ]);

  set({
    loading: false,
    messages: (msgs.data ?? []).map(toMessage),
    tasks: (tasks.data ?? []).map(toTask),
    automations: (autos.data ?? []).map(toAutomation),
    settings: settings.data ? toSettings(settings.data) : defaultSettings,
  });
}

function subscribeRealtime(userId: string): void {
  channel = supabase
    .channel(`hermes:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        const msg = toMessage(payload.new);
        set({ messages: sortMessages(upsertById(state.messages, msg)) });
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          set({ tasks: state.tasks.filter((t) => t.id !== (payload.old as { id: string }).id) });
        } else {
          set({ tasks: upsertById(state.tasks, toTask(payload.new)) });
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'automations', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          set({ automations: state.automations.filter((a) => a.id !== (payload.old as { id: string }).id) });
        } else {
          set({ automations: upsertById(state.automations, toAutomation(payload.new)) });
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType !== 'DELETE') set({ settings: toSettings(payload.new) });
      },
    )
    .subscribe();
}

async function teardown(): Promise<void> {
  if (channel) {
    await supabase.removeChannel(channel);
    channel = null;
  }
  loadedUserId = null;
}

async function onSession(session: Session | null): Promise<void> {
  const userId = session?.user.id ?? null;
  set({ session, authError: null });

  if (userId && userId !== loadedUserId) {
    loadedUserId = userId;
    await loadData(userId);
    subscribeRealtime(userId);
  } else if (!userId && loadedUserId) {
    await teardown();
    set({ messages: [], tasks: [], automations: [], settings: defaultSettings });
  }
}

/** Verifica a sessão atual e passa a ouvir mudanças de auth. Idempotente. */
export async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!isSupabaseConfigured) {
    set({ ready: true });
    return;
  }

  const { data } = await supabase.auth.getSession();
  await onSession(data.session);
  set({ ready: true });

  supabase.auth.onAuthStateChange((_event, session) => {
    void onSession(session);
  });
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

/** Envia uma mensagem ao Hermes (Edge Function). A resposta chega via realtime. */
export async function sendMessage(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !state.session) return;

  set({ sending: true });
  try {
    const { error } = await supabase.functions.invoke('hermes', { body: { message: trimmed } });
    if (error) {
      set({
        messages: sortMessages(
          upsertById(state.messages, {
            id: `err_${Date.now()}`,
            role: 'hermes',
            text: 'Não consegui processar agora. Verifique sua conexão e tente novamente.',
            timestamp: Date.now(),
            narrate: false,
          }),
        ),
      });
    }
  } finally {
    set({ sending: false });
  }
}

/** Botões/sugestões viram mensagens de texto para o Hermes. */
export function pressSuggestion(text: string): void {
  void sendMessage(text);
}

/** Liga/desliga a voz (persistido no Supabase). */
export async function setVoiceEnabled(enabled: boolean): Promise<void> {
  set({ settings: { ...state.settings, voiceEnabled: enabled } }); // otimista
  if (state.session) {
    await supabase
      .from('settings')
      .update({ voice_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', state.session.user.id);
  }
}
