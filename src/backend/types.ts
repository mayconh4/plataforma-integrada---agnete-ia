import { ChatMessage } from '../types/chat';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'done' | 'deferred' | 'cancelled';
export type ModelId = 'claude' | 'gpt' | 'gemini' | 'deepseek' | 'local';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  /** epoch ms — quando uma tarefa adiada deve voltar a ficar pendente */
  deferUntil?: number;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  runs: number;
  createdAt: number;
}

export interface Settings {
  voiceEnabled: boolean;
  preferredModel: ModelId;
}

export interface HermesState {
  startedAt: number;
  tasks: Task[];
  automations: Automation[];
  settings: Settings;
  conversation: ChatMessage[];
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const PRIORITY_ICON: Record<Priority, string> = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

export const MODEL_LABEL: Record<ModelId, string> = {
  claude: 'Claude',
  gpt: 'GPT',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  local: 'Modelo Local',
};

/**
 * Contrato de operações que o motor do Hermes usa para mutar o estado real.
 * Implementado pelo store; consumido pelo engine.
 */
export interface HermesActions {
  createTask(title: string, priority?: Priority): Task;
  completeTask(id: string): Task | undefined;
  completeAllPending(): Task[];
  deferAllPending(minutes: number): Task[];
  cancelAllPending(): Task[];
  setPriority(id: string, priority: Priority): Task | undefined;
  toggleAutomation(id: string): Automation | undefined;
  setModel(model: ModelId): void;
  setVoiceEnabled(enabled: boolean): void;
}
