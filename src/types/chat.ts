export interface ContextButton {
  id: string;
  label: string;
  icon?: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  buttons?: ContextButton[];
  suggestions?: string[];
  /** Whether this message should be auto-narrated when it arrives. */
  narrate?: boolean;
}

export interface ConversationContext {
  lastTopic?: string;
  pendingAction?: string;
  history: ChatMessage[];
}
