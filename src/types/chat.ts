export interface ContextButton {
  id: string;
  label: string;
  icon?: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'hermes';
  text: string;
  timestamp: number;
  buttons?: ContextButton[];
  suggestions?: string[];
  narrate?: boolean;
}

export interface ConversationContext {
  lastTopic?: string;
  pendingAction?: string;
  history: ChatMessage[];
}
