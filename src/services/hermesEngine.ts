import { ChatMessage, ContextButton, ConversationContext } from '../types/chat';

let messageIdCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

type IntentHandler = {
  keywords: string[];
  handle: (input: string, ctx: ConversationContext) => Omit<ChatMessage, 'id' | 'timestamp'>;
};

const intentHandlers: IntentHandler[] = [
  {
    keywords: ['tarefa', 'tarefas', 'pendente', 'pendentes', 'task'],
    handle: (_input, _ctx) => ({
      role: 'hermes',
      text: 'Encontrei 4 tarefas pendentes. O que deseja fazer?',
      buttons: [
        { id: 'b1', label: 'Executar Todas', action: 'execute_all_tasks', variant: 'primary' },
        { id: 'b2', label: 'Escolher Manualmente', action: 'choose_tasks' },
        { id: 'b3', label: 'Adiar 30 minutos', action: 'defer_tasks_30m' },
        { id: 'b4', label: 'Cancelar', action: 'cancel_tasks', variant: 'ghost' },
      ],
      suggestions: ['Mostrar detalhes', 'Priorizar urgentes'],
      narrate: true,
    }),
  },
  {
    keywords: ['modelo', 'model', 'gerar', 'conteúdo', 'conteudo', 'ia', 'ai'],
    handle: () => ({
      role: 'hermes',
      text: 'Qual modelo deseja usar para gerar conteúdo?',
      buttons: [
        { id: 'b1', label: 'Claude', icon: '🟣', action: 'select_model_claude', variant: 'primary' },
        { id: 'b2', label: 'GPT', icon: '🟢', action: 'select_model_gpt' },
        { id: 'b3', label: 'Gemini', icon: '🔵', action: 'select_model_gemini' },
        { id: 'b4', label: 'DeepSeek', icon: '🟠', action: 'select_model_deepseek' },
      ],
      suggestions: ['Modelo Local', 'Comparar modelos'],
      narrate: true,
    }),
  },
  {
    keywords: ['automação', 'automacao', 'automatizar', 'automation'],
    handle: () => ({
      role: 'hermes',
      text: 'Detectei oportunidade de automação. Deseja continuar?',
      buttons: [
        { id: 'b1', label: 'Sim', action: 'confirm_automation', variant: 'primary' },
        { id: 'b2', label: 'Não', action: 'deny_automation', variant: 'ghost' },
        { id: 'b3', label: 'Mostrar Detalhes', action: 'show_automation_details' },
        { id: 'b4', label: 'Executar Mais Tarde', action: 'defer_automation' },
      ],
      narrate: true,
    }),
  },
  {
    keywords: ['prioridade', 'priorizar', 'urgente', 'importância', 'importancia'],
    handle: () => ({
      role: 'hermes',
      text: 'Qual prioridade deseja atribuir?',
      buttons: [
        { id: 'b1', label: 'Urgente', icon: '🔴', action: 'set_priority_urgent', variant: 'danger' },
        { id: 'b2', label: 'Alta', icon: '🟠', action: 'set_priority_high', variant: 'primary' },
        { id: 'b3', label: 'Média', icon: '🟡', action: 'set_priority_medium' },
        { id: 'b4', label: 'Baixa', icon: '🟢', action: 'set_priority_low', variant: 'ghost' },
      ],
      narrate: true,
    }),
  },
  {
    keywords: ['ajuda', 'help', 'como', 'o que', 'menu'],
    handle: () => ({
      role: 'hermes',
      text: 'Sou o Hermes, seu assistente operacional inteligente. Como posso ajudar?',
      buttons: [
        { id: 'b1', label: 'Ver Tarefas', icon: '📋', action: 'show_tasks', variant: 'primary' },
        { id: 'b2', label: 'Automações', icon: '⚡', action: 'show_automations' },
        { id: 'b3', label: 'Configurações', icon: '⚙️', action: 'show_settings' },
        { id: 'b4', label: 'Status do Sistema', icon: '📊', action: 'show_status' },
      ],
      suggestions: ['Gerar conteúdo', 'Definir prioridades'],
      narrate: true,
    }),
  },
  {
    keywords: ['status', 'sistema', 'relatório', 'relatorio', 'dashboard'],
    handle: () => ({
      role: 'hermes',
      text: 'Sistema operando normalmente. 12 agentes ativos, 3 tarefas em execução, 97% de uptime.',
      buttons: [
        { id: 'b1', label: 'Ver Detalhes', action: 'show_status_details', variant: 'primary' },
        { id: 'b2', label: 'Relatório Completo', action: 'full_report' },
        { id: 'b3', label: 'Otimizar', action: 'optimize_system' },
      ],
      suggestions: ['Alertas recentes', 'Performance'],
      narrate: true,
    }),
  },
  {
    keywords: ['configurar', 'configuração', 'configuracao', 'settings', 'preferência'],
    handle: () => ({
      role: 'hermes',
      text: 'O que deseja configurar?',
      buttons: [
        { id: 'b1', label: 'Voz e Áudio', icon: '🔊', action: 'config_voice', variant: 'primary' },
        { id: 'b2', label: 'Agentes IA', icon: '🤖', action: 'config_agents' },
        { id: 'b3', label: 'Notificações', icon: '🔔', action: 'config_notifications' },
        { id: 'b4', label: 'Aparência', icon: '🎨', action: 'config_appearance' },
      ],
      narrate: true,
    }),
  },
];

const actionResponses: Record<string, () => Omit<ChatMessage, 'id' | 'timestamp'>> = {
  execute_all_tasks: () => ({
    role: 'hermes',
    text: 'Executando todas as 4 tarefas pendentes. Tempo estimado: 12 minutos. Deseja acompanhar em tempo real?',
    buttons: [
      { id: 'b1', label: 'Acompanhar', action: 'watch_tasks', variant: 'primary' },
      { id: 'b2', label: 'Notificar ao Concluir', action: 'notify_done' },
      { id: 'b3', label: 'Cancelar Execução', action: 'cancel_execution', variant: 'danger' },
    ],
    narrate: true,
  }),
  choose_tasks: () => ({
    role: 'hermes',
    text: 'Selecione as tarefas que deseja executar:',
    buttons: [
      { id: 'b1', label: 'Sync Dados CRM', action: 'task_crm' },
      { id: 'b2', label: 'Gerar Relatório', action: 'task_report' },
      { id: 'b3', label: 'Backup Automático', action: 'task_backup' },
      { id: 'b4', label: 'Atualizar Agentes', action: 'task_agents' },
    ],
    narrate: true,
  }),
  defer_tasks_30m: () => ({
    role: 'hermes',
    text: 'Tarefas adiadas por 30 minutos. Vou te lembrar às 14:30.',
    buttons: [
      { id: 'b1', label: 'Ok', action: 'acknowledge', variant: 'primary' },
      { id: 'b2', label: 'Alterar Tempo', action: 'change_defer_time' },
    ],
    narrate: true,
  }),
  confirm_automation: () => ({
    role: 'hermes',
    text: 'Automação ativada com sucesso. O fluxo será executado automaticamente quando detectar o gatilho configurado.',
    buttons: [
      { id: 'b1', label: 'Ver Fluxo', action: 'show_flow', variant: 'primary' },
      { id: 'b2', label: 'Testar Agora', action: 'test_automation' },
    ],
    narrate: true,
  }),
  select_model_claude: () => ({
    role: 'hermes',
    text: 'Claude selecionado. Qual tipo de conteúdo deseja gerar?',
    buttons: [
      { id: 'b1', label: 'Texto', action: 'gen_text', variant: 'primary' },
      { id: 'b2', label: 'Análise', action: 'gen_analysis' },
      { id: 'b3', label: 'Código', action: 'gen_code' },
      { id: 'b4', label: 'Resumo', action: 'gen_summary' },
    ],
    narrate: true,
  }),
};

export function processUserInput(input: string, context: ConversationContext): ChatMessage {
  const lower = input.toLowerCase();

  // Check if input is a button action
  const actionHandler = actionResponses[lower];
  if (actionHandler) {
    const partial = actionHandler();
    return { ...partial, id: nextId(), timestamp: Date.now() };
  }

  // Match intent by keywords
  for (const handler of intentHandlers) {
    if (handler.keywords.some((kw) => lower.includes(kw))) {
      const partial = handler.handle(input, context);
      return { ...partial, id: nextId(), timestamp: Date.now() };
    }
  }

  // Default fallback — still provides contextual buttons
  return {
    id: nextId(),
    role: 'hermes',
    text: `Entendi: "${input}". Como deseja prosseguir?`,
    timestamp: Date.now(),
    buttons: [
      { id: 'b1', label: 'Criar Tarefa', action: 'create_task_from_input', variant: 'primary' },
      { id: 'b2', label: 'Pesquisar', action: 'search_input' },
      { id: 'b3', label: 'Automatizar', action: 'automate_input' },
    ],
    suggestions: ['Detalhar mais', 'Ajuda'],
    narrate: true,
  };
}

export function processButtonAction(action: string, context: ConversationContext): ChatMessage {
  const handler = actionResponses[action];
  if (handler) {
    const partial = handler();
    return { ...partial, id: nextId(), timestamp: Date.now() };
  }

  return {
    id: nextId(),
    role: 'hermes',
    text: `Ação "${action}" processada. O que deseja fazer agora?`,
    timestamp: Date.now(),
    buttons: [
      { id: 'b1', label: 'Menu Principal', action: 'help', variant: 'primary' },
      { id: 'b2', label: 'Continuar', action: 'continue_flow' },
    ],
    narrate: true,
  };
}

export function getWelcomeMessage(): ChatMessage {
  return {
    id: nextId(),
    role: 'hermes',
    text: 'Olá! Sou o Hermes, seu assistente operacional inteligente. Estou pronto para ajudar. O que deseja fazer?',
    timestamp: Date.now(),
    buttons: [
      { id: 'b1', label: 'Ver Tarefas', icon: '📋', action: 'show_tasks', variant: 'primary' },
      { id: 'b2', label: 'Gerar Conteúdo', icon: '✨', action: 'select_model' },
      { id: 'b3', label: 'Automações', icon: '⚡', action: 'show_automations' },
      { id: 'b4', label: 'Status do Sistema', icon: '📊', action: 'show_status' },
    ],
    suggestions: ['Configurações', 'Ajuda'],
    narrate: true,
  };
}
