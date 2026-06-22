import { ChatMessage } from '../types/chat';
import {
  Automation,
  HermesActions,
  HermesState,
  ModelId,
  Priority,
  Task,
} from './types';
import { clearState, loadState, saveState } from './storage';
import { handleAction, handleUserInput, welcomeMessage } from '../services/hermesEngine';

type DraftMessage = Omit<ChatMessage, 'id' | 'timestamp'>;

let idCounter = 0;
function nextId(prefix = 'msg'): string {
  return `${prefix}_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;
}

function now(): number {
  return Date.now();
}

// ---------------------------------------------------------------------------
// Estado inicial / seeds
// ---------------------------------------------------------------------------

function seedTask(title: string, priority: Priority): Task {
  const t = now();
  return { id: nextId('task'), title, priority, status: 'pending', createdAt: t, updatedAt: t };
}

function seedAutomation(name: string, trigger: string, enabled: boolean): Automation {
  return { id: nextId('auto'), name, trigger, enabled, runs: 0, createdAt: now() };
}

function defaultState(): HermesState {
  return {
    startedAt: now(),
    settings: { voiceEnabled: true, preferredModel: 'claude' },
    tasks: [
      seedTask('Sincronizar dados do CRM', 'high'),
      seedTask('Gerar relatório semanal', 'medium'),
      seedTask('Executar backup automático', 'low'),
      seedTask('Atualizar agentes de IA', 'urgent'),
    ],
    automations: [
      seedAutomation('Sync CRM diário', 'Todo dia às 08:00', true),
      seedAutomation('Backup noturno', 'Todo dia às 02:00', true),
      seedAutomation('Resumo executivo', 'Sexta-feira às 18:00', false),
    ],
    conversation: [],
  };
}

// ---------------------------------------------------------------------------
// Estado mutável + assinatura
// ---------------------------------------------------------------------------

let state: HermesState = defaultState();
let initialized = false;
const listeners = new Set<() => void>();

function commit(next: HermesState): void {
  state = next;
  void saveState(state);
  listeners.forEach((l) => l());
}

export function getState(): HermesState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reativa tarefas adiadas cujo prazo já passou. Retorna novo array (ou o mesmo se nada mudou). */
function reconcileTasks(tasks: Task[]): Task[] {
  const t = now();
  let changed = false;
  const next = tasks.map((task) => {
    if (task.status === 'deferred' && task.deferUntil != null && task.deferUntil <= t) {
      changed = true;
      return { ...task, status: 'pending' as const, deferUntil: undefined, updatedAt: t };
    }
    return task;
  });
  return changed ? next : tasks;
}

function withMeta(draft: DraftMessage): ChatMessage {
  return { ...draft, id: nextId(), timestamp: now() };
}

// ---------------------------------------------------------------------------
// Ações de domínio (HermesActions) — todas imutáveis
// ---------------------------------------------------------------------------

const actions: HermesActions = {
  createTask(title, priority = 'medium') {
    const task = seedTask(title.trim() || 'Nova tarefa', priority);
    commit({ ...state, tasks: [...state.tasks, task] });
    return task;
  },

  completeTask(id) {
    let updated: Task | undefined;
    const tasks = state.tasks.map((task) => {
      if (task.id === id && task.status !== 'done') {
        updated = { ...task, status: 'done' as const, updatedAt: now() };
        return updated;
      }
      return task;
    });
    if (updated) commit({ ...state, tasks });
    return updated;
  },

  completeAllPending() {
    const completed: Task[] = [];
    const tasks = state.tasks.map((task) => {
      if (task.status === 'pending') {
        const done = { ...task, status: 'done' as const, updatedAt: now() };
        completed.push(done);
        return done;
      }
      return task;
    });
    if (completed.length) commit({ ...state, tasks });
    return completed;
  },

  deferAllPending(minutes) {
    const deferUntil = now() + minutes * 60_000;
    const deferred: Task[] = [];
    const tasks = state.tasks.map((task) => {
      if (task.status === 'pending') {
        const d = { ...task, status: 'deferred' as const, deferUntil, updatedAt: now() };
        deferred.push(d);
        return d;
      }
      return task;
    });
    if (deferred.length) commit({ ...state, tasks });
    return deferred;
  },

  cancelAllPending() {
    const cancelled: Task[] = [];
    const tasks = state.tasks.map((task) => {
      if (task.status === 'pending') {
        const c = { ...task, status: 'cancelled' as const, updatedAt: now() };
        cancelled.push(c);
        return c;
      }
      return task;
    });
    if (cancelled.length) commit({ ...state, tasks });
    return cancelled;
  },

  setPriority(id, priority) {
    let updated: Task | undefined;
    const tasks = state.tasks.map((task) => {
      if (task.id === id) {
        updated = { ...task, priority, updatedAt: now() };
        return updated;
      }
      return task;
    });
    if (updated) commit({ ...state, tasks });
    return updated;
  },

  toggleAutomation(id) {
    let updated: Automation | undefined;
    const automations = state.automations.map((a) => {
      if (a.id === id) {
        updated = { ...a, enabled: !a.enabled, runs: !a.enabled ? a.runs + 1 : a.runs };
        return updated;
      }
      return a;
    });
    if (updated) commit({ ...state, automations });
    return updated;
  },

  setModel(model: ModelId) {
    commit({ ...state, settings: { ...state.settings, preferredModel: model } });
  },

  setVoiceEnabled(enabled) {
    commit({ ...state, settings: { ...state.settings, voiceEnabled: enabled } });
  },
};

// ---------------------------------------------------------------------------
// API pública consumida pela UI
// ---------------------------------------------------------------------------

/** Carrega o estado persistido e mescla com os defaults. Idempotente. */
export async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const saved = await loadState();
  const base = defaultState();
  let next: HermesState = base;

  if (saved) {
    next = {
      startedAt: saved.startedAt ?? base.startedAt,
      tasks: saved.tasks ?? base.tasks,
      automations: saved.automations ?? base.automations,
      settings: { ...base.settings, ...(saved.settings ?? {}) },
      conversation: saved.conversation ?? [],
    };
  }

  next = { ...next, tasks: reconcileTasks(next.tasks) };

  // Mensagem de boas-vindas apenas na primeira sessão (conversa vazia).
  if (next.conversation.length === 0) {
    next = { ...next, conversation: [withMeta(welcomeMessage(next))] };
  }

  commit(next);
}

function reconcileBeforeInteraction(): void {
  const tasks = reconcileTasks(state.tasks);
  if (tasks !== state.tasks) {
    state = { ...state, tasks };
  }
}

/** Mensagem digitada pelo usuário. */
export function sendMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  reconcileBeforeInteraction();

  const userMsg: ChatMessage = {
    id: nextId('user'),
    role: 'user',
    text: trimmed,
    timestamp: now(),
  };
  const draft = handleUserInput(trimmed, state, actions);
  const hermesMsg = withMeta(draft);
  commit({ ...state, conversation: [...state.conversation, userMsg, hermesMsg] });
}

/** Toque em um botão contextual. `label` é exibido como bolha do usuário. */
export function pressButton(action: string, label: string): void {
  if (action === 'clear_conversation') {
    clearConversation();
    return;
  }
  reconcileBeforeInteraction();

  const userMsg: ChatMessage = {
    id: nextId('user'),
    role: 'user',
    text: label,
    timestamp: now(),
  };
  const draft = handleAction(action, state, actions);
  const hermesMsg = withMeta(draft);
  commit({ ...state, conversation: [...state.conversation, userMsg, hermesMsg] });
}

/** Toque em um chip de sugestão (tratado como texto natural). */
export function pressSuggestion(text: string): void {
  sendMessage(text);
}

/** Liga/desliga a voz (persistido). */
export function setVoiceEnabled(enabled: boolean): void {
  actions.setVoiceEnabled(enabled);
}

/** Limpa a conversa, mantendo tarefas/automações/configurações. */
export function clearConversation(): void {
  commit({ ...state, conversation: [withMeta(welcomeMessage(state))] });
}

/** Reseta tudo para o estado de fábrica (apaga persistência). */
export async function resetAll(): Promise<void> {
  await clearState();
  const fresh = defaultState();
  commit({ ...fresh, conversation: [withMeta(welcomeMessage(fresh))] });
}
