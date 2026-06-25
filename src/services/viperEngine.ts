import { ChatMessage, ConversationContext } from '../types/chat';

let messageIdCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

type Partial = Omit<ChatMessage, 'id' | 'timestamp'>;

type IntentHandler = {
  keywords: string[];
  handle: () => Partial;
};

const intentHandlers: IntentHandler[] = [
  {
    keywords: ['tarefa', 'tarefas', 'pendente', 'pendentes', 'task'],
    handle: () => ({
      role: 'agent',
      text: 'Você tem tarefas pendentes. O que deseja fazer com elas?',
      buttons: [
        { id: 'b1', label: 'Ver minhas tarefas', icon: '✅', action: 'open_tarefas', variant: 'primary' },
        { id: 'b2', label: 'Executar urgentes', icon: '⚡', action: 'execute_urgent' },
        { id: 'b3', label: 'Adiar 30 min', action: 'defer_tasks_30m', variant: 'ghost' },
      ],
      suggestions: ['Priorizar urgentes', 'Resumo do dia'],
      narrate: true,
    }),
  },
  {
    keywords: ['projeto', 'projetos', 'airsoft', 'barber', 'beleza', 'perfection', 'peri'],
    handle: () => ({
      role: 'agent',
      text: 'Reconheço a referência a um projeto. Posso abrir o painel com as métricas dos agentes, o caminho do projeto e o cérebro do agente.',
      buttons: [
        { id: 'b1', label: 'Abrir Projetos', icon: '📁', action: 'open_projetos', variant: 'primary' },
        { id: 'b2', label: 'Acionar agente autônomo', icon: '🤖', action: 'trigger_agent' },
        { id: 'b3', label: 'Ver skills ativas', action: 'show_skills' },
      ],
      narrate: true,
    }),
  },
  {
    keywords: ['meta', 'metas', 'objetivo', 'objetivos'],
    handle: () => ({
      role: 'agent',
      text: 'Suas metas prioritárias estão organizadas por prioridade. Quer revisar?',
      buttons: [
        { id: 'b1', label: 'Ver Metas', icon: '🎯', action: 'open_metas', variant: 'primary' },
        { id: 'b2', label: 'Nova meta', action: 'new_goal' },
      ],
      narrate: true,
    }),
  },
  {
    keywords: ['resumo', 'dia', 'status', 'sistema', 'dashboard', 'painel'],
    handle: () => ({
      role: 'agent',
      text: 'Sistema operando normalmente. Agentes ativos trabalhando nos projetos, automações em execução e fila estável.',
      buttons: [
        { id: 'b1', label: 'Abrir Resumo', icon: '📊', action: 'open_resumo', variant: 'primary' },
        { id: 'b2', label: 'Status detalhado', action: 'show_status' },
      ],
      suggestions: ['Ver minhas tarefas', 'Projetos'],
      narrate: true,
    }),
  },
  {
    keywords: ['config', 'configuração', 'configuracao', 'tema', 'aparência', 'aparencia', 'conta', 'voz'],
    handle: () => ({
      role: 'agent',
      text: 'Posso ajustar sua conta: tema claro/escuro, voz e o modo sempre ativo.',
      buttons: [
        { id: 'b1', label: 'Abrir Minha Conta', icon: '⚙️', action: 'open_conta', variant: 'primary' },
        { id: 'b2', label: 'Alternar tema', icon: '🎨', action: 'toggle_theme' },
      ],
      narrate: true,
    }),
  },
  {
    keywords: ['ajuda', 'help', 'como', 'menu', 'o que voce faz', 'o que você faz'],
    handle: () => ({
      role: 'agent',
      text: 'Sou a Viper, sua assistente operacional. Coordeno agentes, tarefas, metas e projetos por voz ou texto.',
      buttons: [
        { id: 'b1', label: 'Ver minhas tarefas', icon: '✅', action: 'open_tarefas', variant: 'primary' },
        { id: 'b2', label: 'Projetos', icon: '📁', action: 'open_projetos' },
        { id: 'b3', label: 'Metas', icon: '🎯', action: 'open_metas' },
        { id: 'b4', label: 'Minha conta', icon: '⚙️', action: 'open_conta' },
      ],
      suggestions: ['Resumo do dia', 'Status do sistema'],
      narrate: true,
    }),
  },
];

function fallback(input: string): Partial {
  return {
    role: 'agent',
    text: `Entendi: "${input}". Como deseja prosseguir?`,
    buttons: [
      { id: 'b1', label: 'Criar tarefa', icon: '✅', action: 'open_tarefas', variant: 'primary' },
      { id: 'b2', label: 'Abrir projetos', icon: '📁', action: 'open_projetos' },
      { id: 'b3', label: 'Ajuda', action: 'help', variant: 'ghost' },
    ],
    suggestions: ['Resumo do dia', 'Status do sistema'],
    narrate: true,
  };
}

export function processUserInput(input: string, _ctx: ConversationContext): ChatMessage {
  const lower = input.toLowerCase();
  for (const handler of intentHandlers) {
    if (handler.keywords.some((kw) => lower.includes(kw))) {
      return { ...handler.handle(), id: nextId(), timestamp: Date.now() };
    }
  }
  return { ...fallback(input), id: nextId(), timestamp: Date.now() };
}

export function getWelcomeMessage(userName?: string): ChatMessage {
  return {
    id: nextId(),
    role: 'agent',
    text: `Olá${userName ? `, ${userName}` : ''}! Sou a Viper, sua assistente operacional. Estou online e pronta. O que deseja fazer?`,
    timestamp: Date.now(),
    buttons: [
      { id: 'b1', label: 'Ver minhas tarefas', icon: '✅', action: 'open_tarefas', variant: 'primary' },
      { id: 'b2', label: 'Resumo do dia', icon: '📊', action: 'open_resumo' },
      { id: 'b3', label: 'Status do sistema', icon: '⚡', action: 'show_status' },
    ],
    suggestions: ['Projetos', 'Metas', 'Minha conta'],
    narrate: true,
  };
}

/** Actions that simply navigate are mapped by the screen; others produce a reply here. */
export function replyForAction(action: string): ChatMessage {
  const map: Record<string, Partial> = {
    execute_urgent: {
      role: 'agent',
      text: 'Acionei os agentes para as tarefas urgentes. Vou te avisar quando concluírem.',
      buttons: [{ id: 'b1', label: 'Ver minhas tarefas', icon: '✅', action: 'open_tarefas', variant: 'primary' }],
      narrate: true,
    },
    trigger_agent: {
      role: 'agent',
      text: 'Agente autônomo acionado. Ele já está atuando com as skills ativas do projeto.',
      buttons: [{ id: 'b1', label: 'Abrir Projetos', icon: '📁', action: 'open_projetos', variant: 'primary' }],
      narrate: true,
    },
    defer_tasks_30m: {
      role: 'agent',
      text: 'Tarefas adiadas por 30 minutos. Vou te lembrar.',
      narrate: true,
    },
    show_status: {
      role: 'agent',
      text: 'Tudo verde: agentes ativos, automações rodando e uptime saudável.',
      buttons: [{ id: 'b1', label: 'Abrir Resumo', icon: '📊', action: 'open_resumo', variant: 'primary' }],
      narrate: true,
    },
    show_skills: {
      role: 'agent',
      text: 'As skills ativas aparecem no painel de cada projeto, com a carga de cada uma.',
      buttons: [{ id: 'b1', label: 'Abrir Projetos', icon: '📁', action: 'open_projetos', variant: 'primary' }],
      narrate: true,
    },
  };
  const partial = map[action] ?? {
    role: 'agent' as const,
    text: 'Feito. O que deseja fazer agora?',
    narrate: true,
  };
  return { ...partial, id: nextId(), timestamp: Date.now() };
}
