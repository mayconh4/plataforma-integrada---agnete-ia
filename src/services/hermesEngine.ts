import { ChatMessage, ContextButton } from '../types/chat';
import {
  HermesActions,
  HermesState,
  MODEL_LABEL,
  ModelId,
  Priority,
  PRIORITY_ICON,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  Task,
} from '../backend/types';

type Draft = Omit<ChatMessage, 'id' | 'timestamp'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pendingTasks(state: HermesState): Task[] {
  return state.tasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.createdAt - b.createdAt,
    );
}

function plural(n: number, singular: string, prefixPlural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${prefixPlural}`;
}

function taskLines(tasks: Task[]): string {
  return tasks
    .map((t) => `${PRIORITY_ICON[t.priority]} ${t.title} — ${PRIORITY_LABEL[t.priority]}`)
    .join('\n');
}

function taskButtons(tasks: Task[], verb: string): ContextButton[] {
  return tasks.slice(0, 6).map((t, i) => ({
    id: `${verb}_${i}`,
    label: t.title,
    icon: PRIORITY_ICON[t.priority],
    action: `${verb}:${t.id}`,
  }));
}

function extractTaskTitle(text: string): string {
  let t = text.trim();
  if (t.includes(':')) {
    t = t.slice(t.indexOf(':') + 1).trim();
  } else {
    t = t
      .replace(
        /^\s*(criar|cria|crie|adicionar|adiciona|adicione|nova|novo|registrar|registra|anotar|anota|lembrar(?:\s+de)?)\s+/i,
        '',
      )
      .replace(/^\s*(uma\s+|um\s+)?(tarefa|task|lembrete|afazer|to-?do)\s+(de\s+|para\s+|que\s+)?/i, '');
  }
  return t.trim();
}

const helpButtons: ContextButton[] = [
  { id: 'b1', label: 'Ver Tarefas', icon: '📋', action: 'show_tasks', variant: 'primary' },
  { id: 'b2', label: 'Gerar Conteúdo', icon: '✨', action: 'select_model' },
  { id: 'b3', label: 'Automações', icon: '⚡', action: 'show_automations' },
  { id: 'b4', label: 'Status', icon: '📊', action: 'show_status' },
];

// ---------------------------------------------------------------------------
// Respostas de domínio reutilizáveis
// ---------------------------------------------------------------------------

function tasksOverview(state: HermesState): Draft {
  const pending = pendingTasks(state);
  if (pending.length === 0) {
    return {
      role: 'hermes',
      text: 'Você não tem tarefas pendentes no momento. 🎉',
      buttons: [
        { id: 'b1', label: 'Criar Tarefa', icon: '➕', action: 'new_task_hint', variant: 'primary' },
        { id: 'b2', label: 'Automações', icon: '⚡', action: 'show_automations' },
        { id: 'b3', label: 'Status', icon: '📊', action: 'show_status' },
      ],
      narrate: true,
    };
  }
  return {
    role: 'hermes',
    text: `Você tem ${plural(pending.length, 'tarefa pendente', 'tarefas pendentes')}:\n${taskLines(
      pending,
    )}\n\nO que deseja fazer?`,
    buttons: [
      { id: 'b1', label: 'Executar Todas', action: 'execute_all_tasks', variant: 'primary' },
      { id: 'b2', label: 'Escolher', action: 'choose_tasks' },
      { id: 'b3', label: 'Priorizar', action: 'prioritize' },
      { id: 'b4', label: 'Adiar 30 min', action: 'defer_tasks_30m' },
      { id: 'b5', label: 'Cancelar Todas', action: 'cancel_tasks', variant: 'danger' },
    ],
    narrate: true,
  };
}

function automationsOverview(state: HermesState): Draft {
  const lines = state.automations
    .map((a) => `${a.enabled ? '🟢' : '⚪️'} ${a.name} — ${a.trigger}`)
    .join('\n');
  const active = state.automations.filter((a) => a.enabled).length;
  return {
    role: 'hermes',
    text: `${active} de ${state.automations.length} automações ativas:\n${lines}\n\nToque para ligar/desligar:`,
    buttons: state.automations.map((a, i) => ({
      id: `auto_${i}`,
      label: `${a.name} ${a.enabled ? '(ligada)' : '(desligada)'}`,
      icon: a.enabled ? '⏸️' : '▶️',
      action: `toggle_auto:${a.id}`,
      variant: a.enabled ? ('secondary' as const) : ('primary' as const),
    })),
    narrate: true,
  };
}

function statusOverview(state: HermesState): Draft {
  const pending = state.tasks.filter((t) => t.status === 'pending').length;
  const done = state.tasks.filter((t) => t.status === 'done').length;
  const deferred = state.tasks.filter((t) => t.status === 'deferred').length;
  const autos = state.automations.filter((a) => a.enabled).length;
  const ms = Date.now() - state.startedAt;
  const hours = Math.floor(ms / 3_600_000);
  const uptime = hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return {
    role: 'hermes',
    text: `📊 Status do sistema\n• ${pending} pendente(s), ${done} concluída(s), ${deferred} adiada(s)\n• ${autos} automação(ões) ativa(s)\n• Modelo atual: ${MODEL_LABEL[state.settings.preferredModel]}\n• Voz: ${state.settings.voiceEnabled ? 'ligada' : 'desligada'}\n• Ativo há ${uptime}`,
    buttons: [
      { id: 'b1', label: 'Ver Tarefas', action: 'show_tasks', variant: 'primary' },
      { id: 'b2', label: 'Automações', action: 'show_automations' },
      { id: 'b3', label: 'Configurações', action: 'show_settings' },
    ],
    narrate: true,
  };
}

function settingsOverview(state: HermesState): Draft {
  return {
    role: 'hermes',
    text: 'O que deseja configurar?',
    buttons: [
      {
        id: 'b1',
        label: `Voz: ${state.settings.voiceEnabled ? 'Ligada' : 'Desligada'}`,
        icon: '🔊',
        action: 'config_voice',
        variant: 'primary',
      },
      {
        id: 'b2',
        label: `Modelo: ${MODEL_LABEL[state.settings.preferredModel]}`,
        icon: '🤖',
        action: 'select_model',
      },
      { id: 'b3', label: 'Limpar Conversa', icon: '🧹', action: 'clear_conversation' },
    ],
    narrate: true,
  };
}

function modelPicker(): Draft {
  const models: ModelId[] = ['claude', 'gpt', 'gemini', 'deepseek', 'local'];
  const icons: Record<ModelId, string> = {
    claude: '🟣',
    gpt: '🟢',
    gemini: '🔵',
    deepseek: '🟠',
    local: '⚫️',
  };
  return {
    role: 'hermes',
    text: 'Qual modelo deseja usar para gerar conteúdo?',
    buttons: models.map((m, i) => ({
      id: `m_${i}`,
      label: MODEL_LABEL[m],
      icon: icons[m],
      action: `set_model:${m}`,
      variant: i === 0 ? ('primary' as const) : undefined,
    })),
    narrate: true,
  };
}

// ---------------------------------------------------------------------------
// Entrada de texto livre
// ---------------------------------------------------------------------------

export function handleUserInput(input: string, state: HermesState, actions: HermesActions): Draft {
  const lower = input.toLowerCase();

  // Criação de tarefa em linguagem natural
  const isCreate = /\b(criar|cria|crie|adicionar|adiciona|adicione|nova|novo|registrar|anotar|lembrar)\b/.test(
    lower,
  );
  if (isCreate && /(tarefa|task|lembrete|afazer|to-?do)/.test(lower)) {
    const title = extractTaskTitle(input) || 'Nova tarefa';
    const task = actions.createTask(title);
    return {
      role: 'hermes',
      text: `Tarefa criada: "${task.title}" (prioridade ${PRIORITY_LABEL[task.priority]}). Deseja ajustar a prioridade?`,
      buttons: [
        { id: 'b1', label: 'Definir Prioridade', action: `prio_task:${task.id}`, variant: 'primary' },
        { id: 'b2', label: 'Ver Tarefas', action: 'show_tasks' },
      ],
      narrate: true,
    };
  }

  if (/(tarefa|tarefas|pendente|pendentes|afazer|to-?do)/.test(lower)) {
    return tasksOverview(state);
  }
  if (/(modelo|model|gerar|gera|conteúdo|conteudo|\bia\b|\bai\b)/.test(lower)) {
    return modelPicker();
  }
  if (/(automa(ç|c)(ã|a)o|automatizar|automation|rotina|fluxo)/.test(lower)) {
    return automationsOverview(state);
  }
  if (/(prioridade|priorizar|urgente|importan)/.test(lower)) {
    return handleAction('prioritize', state, actions);
  }
  if (/(status|sistema|relat(ó|o)rio|dashboard|painel)/.test(lower)) {
    return statusOverview(state);
  }
  if (/(configurar|configura(ç|c)(ã|a)o|settings|prefer(ê|e)ncia|ajustes)/.test(lower)) {
    return settingsOverview(state);
  }
  if (/(ajuda|help|menu|^ol(á|a)$|^oi$|^e a(í|i)$|o que voc(ê|e) faz)/.test(lower)) {
    return {
      role: 'hermes',
      text: 'Sou o Hermes, seu assistente operacional. Posso gerenciar suas tarefas, automações e configurações. Como posso ajudar?',
      buttons: helpButtons,
      suggestions: ['Ver tarefas', 'Criar tarefa: revisar estoque', 'Status'],
      narrate: true,
    };
  }

  // Fallback — oferece criar tarefa a partir do texto digitado
  return {
    role: 'hermes',
    text: `Entendi: "${input}". Como deseja prosseguir?`,
    buttons: [
      { id: 'b1', label: 'Criar como Tarefa', action: `create_task:${input}`, variant: 'primary' },
      { id: 'b2', label: 'Ver Tarefas', action: 'show_tasks' },
      { id: 'b3', label: 'Ajuda', action: 'help' },
    ],
    suggestions: ['Status', 'Automações'],
    narrate: true,
  };
}

// ---------------------------------------------------------------------------
// Ações de botões
// ---------------------------------------------------------------------------

export function handleAction(action: string, state: HermesState, actions: HermesActions): Draft {
  const sep = action.indexOf(':');
  const verb = sep === -1 ? action : action.slice(0, sep);
  const arg = sep === -1 ? '' : action.slice(sep + 1);

  switch (verb) {
    case 'show_tasks':
      return tasksOverview(state);

    case 'execute_all_tasks': {
      const done = actions.completeAllPending();
      if (done.length === 0) {
        return { role: 'hermes', text: 'Não há tarefas pendentes para executar.', buttons: helpButtons, narrate: true };
      }
      return {
        role: 'hermes',
        text: `✅ Concluí ${plural(done.length, 'tarefa', 'tarefas')}: ${done
          .map((t) => t.title)
          .join(', ')}.`,
        buttons: [
          { id: 'b1', label: 'Ver Tarefas', action: 'show_tasks', variant: 'primary' },
          { id: 'b2', label: 'Status', action: 'show_status' },
        ],
        narrate: true,
      };
    }

    case 'choose_tasks': {
      const pending = pendingTasks(state);
      if (pending.length === 0) {
        return tasksOverview(state);
      }
      return {
        role: 'hermes',
        text: 'Toque na tarefa que deseja concluir:',
        buttons: taskButtons(pending, 'run_task'),
        narrate: true,
      };
    }

    case 'run_task': {
      const task = actions.completeTask(arg);
      return {
        role: 'hermes',
        text: task ? `✅ Tarefa concluída: "${task.title}".` : 'Tarefa não encontrada.',
        buttons: [
          { id: 'b1', label: 'Concluir Outra', action: 'choose_tasks', variant: 'primary' },
          { id: 'b2', label: 'Ver Tarefas', action: 'show_tasks' },
        ],
        narrate: true,
      };
    }

    case 'defer_tasks_30m': {
      const deferred = actions.deferAllPending(30);
      return {
        role: 'hermes',
        text: deferred.length
          ? `⏰ ${plural(deferred.length, 'tarefa adiada', 'tarefas adiadas')} por 30 minutos. Volto a lembrar você.`
          : 'Não há tarefas pendentes para adiar.',
        buttons: [{ id: 'b1', label: 'Ok', action: 'show_status', variant: 'primary' }],
        narrate: true,
      };
    }

    case 'cancel_tasks': {
      const cancelled = actions.cancelAllPending();
      return {
        role: 'hermes',
        text: cancelled.length
          ? `🗑️ ${plural(cancelled.length, 'tarefa cancelada', 'tarefas canceladas')}.`
          : 'Não há tarefas pendentes para cancelar.',
        buttons: [{ id: 'b1', label: 'Ver Tarefas', action: 'show_tasks', variant: 'primary' }],
        narrate: true,
      };
    }

    case 'prioritize': {
      const pending = pendingTasks(state);
      if (pending.length === 0) {
        return tasksOverview(state);
      }
      return {
        role: 'hermes',
        text: 'Qual tarefa deseja priorizar?',
        buttons: taskButtons(pending, 'prio_task'),
        narrate: true,
      };
    }

    case 'prio_task': {
      const levels: Priority[] = ['urgent', 'high', 'medium', 'low'];
      return {
        role: 'hermes',
        text: 'Qual prioridade deseja atribuir?',
        buttons: levels.map((p, i) => ({
          id: `p_${i}`,
          label: PRIORITY_LABEL[p],
          icon: PRIORITY_ICON[p],
          action: `set_priority:${arg}:${p}`,
          variant: p === 'urgent' ? ('danger' as const) : p === 'high' ? ('primary' as const) : undefined,
        })),
        narrate: true,
      };
    }

    case 'set_priority': {
      const [id, level] = arg.split(':');
      const task = actions.setPriority(id, level as Priority);
      return {
        role: 'hermes',
        text: task
          ? `Prioridade de "${task.title}" definida como ${PRIORITY_LABEL[task.priority]} ${PRIORITY_ICON[task.priority]}.`
          : 'Tarefa não encontrada.',
        buttons: [{ id: 'b1', label: 'Ver Tarefas', action: 'show_tasks', variant: 'primary' }],
        narrate: true,
      };
    }

    case 'show_automations':
      return automationsOverview(state);

    case 'toggle_auto': {
      const auto = actions.toggleAutomation(arg);
      return {
        role: 'hermes',
        text: auto
          ? `${auto.name} ${auto.enabled ? 'ativada ✅' : 'desativada ⏸️'}.`
          : 'Automação não encontrada.',
        buttons: [{ id: 'b1', label: 'Ver Automações', action: 'show_automations', variant: 'primary' }],
        narrate: true,
      };
    }

    case 'show_status':
      return statusOverview(state);

    case 'show_settings':
      return settingsOverview(state);

    case 'config_voice':
      return {
        role: 'hermes',
        text: `A voz está ${state.settings.voiceEnabled ? 'ligada' : 'desligada'}. O que deseja?`,
        buttons: [
          { id: 'b1', label: 'Ligar Voz', icon: '🔊', action: 'set_voice:on', variant: 'primary' },
          { id: 'b2', label: 'Desligar Voz', icon: '🔇', action: 'set_voice:off', variant: 'ghost' },
        ],
        narrate: true,
      };

    case 'set_voice': {
      const enabled = arg === 'on';
      actions.setVoiceEnabled(enabled);
      return {
        role: 'hermes',
        text: enabled ? 'Voz ligada 🔊.' : 'Voz desligada 🔇.',
        buttons: [{ id: 'b1', label: 'Configurações', action: 'show_settings', variant: 'primary' }],
        narrate: enabled,
      };
    }

    case 'select_model':
      return modelPicker();

    case 'set_model': {
      actions.setModel(arg as ModelId);
      return {
        role: 'hermes',
        text: `Modelo ${MODEL_LABEL[arg as ModelId]} selecionado. Tudo pronto para gerar conteúdo.`,
        buttons: [
          { id: 'b1', label: 'Ver Tarefas', action: 'show_tasks', variant: 'primary' },
          { id: 'b2', label: 'Configurações', action: 'show_settings' },
        ],
        narrate: true,
      };
    }

    case 'create_task': {
      const task = actions.createTask(extractTaskTitle(arg) || arg);
      return {
        role: 'hermes',
        text: `Tarefa criada: "${task.title}".`,
        buttons: [
          { id: 'b1', label: 'Definir Prioridade', action: `prio_task:${task.id}`, variant: 'primary' },
          { id: 'b2', label: 'Ver Tarefas', action: 'show_tasks' },
        ],
        narrate: true,
      };
    }

    case 'new_task_hint':
      return {
        role: 'hermes',
        text: 'Para criar uma tarefa, digite algo como "criar tarefa: revisar estoque".',
        suggestions: ['Criar tarefa: revisar estoque', 'Ver tarefas'],
        narrate: true,
      };

    case 'clear_conversation':
      // A limpeza em si é tratada pela UI/store; aqui apenas confirmamos.
      return {
        role: 'hermes',
        text: 'Conversa limpa.',
        buttons: helpButtons,
        narrate: false,
      };

    case 'help':
      return {
        role: 'hermes',
        text: 'Como posso ajudar?',
        buttons: helpButtons,
        suggestions: ['Ver tarefas', 'Status', 'Automações'],
        narrate: true,
      };

    default:
      return {
        role: 'hermes',
        text: 'Não reconheci essa ação. Veja o que posso fazer:',
        buttons: helpButtons,
        narrate: true,
      };
  }
}

// ---------------------------------------------------------------------------
// Boas-vindas
// ---------------------------------------------------------------------------

export function welcomeMessage(state: HermesState): Draft {
  const pending = pendingTasks(state).length;
  return {
    role: 'hermes',
    text:
      'Olá! Sou o Hermes, seu assistente operacional inteligente.' +
      (pending > 0
        ? ` Você tem ${plural(pending, 'tarefa pendente', 'tarefas pendentes')}.`
        : ' Tudo em dia por aqui.') +
      ' O que deseja fazer?',
    buttons: helpButtons,
    suggestions: ['Ver tarefas', 'Status', 'Configurações'],
    narrate: true,
  };
}
