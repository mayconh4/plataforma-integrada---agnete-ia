// ============================================================================
// Edge Function: hermes
// ----------------------------------------------------------------------------
// O "cérebro" do Hermes. Recebe a mensagem do usuário, carrega o contexto
// (tarefas, automações, histórico), chama a IA via OpenRouter com tool-calling
// para AGIR de verdade sobre o banco, e grava a resposta. O realtime entrega
// as novas linhas ao app.
//
// Secrets necessários (supabase secrets set ...):
//   OPENROUTER_API_KEY  -> sua chave do OpenRouter
// Injetados automaticamente pelo Supabase: SUPABASE_URL, SUPABASE_ANON_KEY.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Mapeia o modelo escolhido nas configurações para um slug do OpenRouter.
// Ajuste à vontade — veja os slugs em https://openrouter.ai/models
const MODEL_MAP: Record<string, string> = {
  claude: 'anthropic/claude-3.5-sonnet',
  gpt: 'openai/gpt-4o-mini',
  gemini: 'google/gemini-flash-1.5',
  deepseek: 'deepseek/deepseek-chat',
  local: 'meta-llama/llama-3.1-8b-instruct',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT = `Você é o Hermes, um assistente operacional em português do Brasil.
Você ajuda o usuário a gerenciar tarefas e automações e responde perguntas de forma objetiva e amigável.
Use as ferramentas disponíveis para AGIR de verdade (criar/concluir/adiar/priorizar tarefas, ligar/desligar automações) sempre que o usuário pedir algo acionável.
Depois de agir, confirme o que foi feito em uma frase curta. Não invente dados que não estão no contexto.

Sempre que precisar de uma DECISÃO, CONFIRMAÇÃO ou quiser oferecer caminhos claros ao usuário,
use a ferramenta present_options para mostrar botões de múltipla escolha (2 a 4 opções curtas)
em vez de só perguntar em texto. Ex.: "Qual prioridade?", "Confirmar?", "Qual modelo?".
Cada opção deve ser uma resposta curta e autoexplicativa, pois o texto da opção é o que o usuário
te enviará de volta ao tocar no botão.`;

// Definição das ferramentas expostas à IA (formato OpenAI/OpenRouter).
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'present_options',
      description:
        'Apresenta ao usuário uma pergunta com botões de múltipla escolha. Use sempre que precisar de uma decisão/confirmação ou quiser oferecer caminhos claros. Esta é uma resposta final: NÃO chame outras ferramentas junto.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'A pergunta ou instrução mostrada acima dos botões' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'De 2 a 4 opções curtas e autoexplicativas',
          },
        },
        required: ['text', 'options'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Cria uma nova tarefa para o usuário.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título da tarefa' },
          priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Marca como concluída a tarefa pendente cujo título melhor corresponde.',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' } },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_all_pending',
      description: 'Conclui todas as tarefas pendentes.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'defer_all_pending',
      description: 'Adia todas as tarefas pendentes por X minutos.',
      parameters: {
        type: 'object',
        properties: { minutes: { type: 'number' } },
        required: ['minutes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_priority',
      description: 'Define a prioridade da tarefa cujo título melhor corresponde.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
        },
        required: ['title', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_automation',
      description: 'Liga ou desliga a automação cujo nome melhor corresponde.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
  },
];

// deno-lint-ignore no-explicit-any
type SB = any;

async function findTaskByTitle(supabase: SB, userId: string, title: string, onlyPending: boolean) {
  let q = supabase.from('tasks').select('*').eq('user_id', userId).ilike('title', `%${title}%`);
  if (onlyPending) q = q.eq('status', 'pending');
  const { data } = await q.limit(1);
  return data?.[0] ?? null;
}

// Executa uma ferramenta e devolve um texto curto com o resultado (vai de volta para a IA).
async function runTool(supabase: SB, userId: string, name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'create_task': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, title: String(args.title), priority: (args.priority as string) ?? 'medium' })
        .select()
        .single();
      return error ? `erro: ${error.message}` : `tarefa criada: "${data.title}" (${data.priority})`;
    }
    case 'complete_task': {
      const task = await findTaskByTitle(supabase, userId, String(args.title), true);
      if (!task) return 'nenhuma tarefa pendente correspondente encontrada';
      await supabase.from('tasks').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', task.id);
      return `tarefa concluída: "${task.title}"`;
    }
    case 'complete_all_pending': {
      const { data } = await supabase
        .from('tasks')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select();
      return `${data?.length ?? 0} tarefa(s) concluída(s)`;
    }
    case 'defer_all_pending': {
      const minutes = Number(args.minutes) || 30;
      const deferUntil = new Date(Date.now() + minutes * 60_000).toISOString();
      const { data } = await supabase
        .from('tasks')
        .update({ status: 'deferred', defer_until: deferUntil, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select();
      return `${data?.length ?? 0} tarefa(s) adiada(s) por ${minutes} min`;
    }
    case 'set_priority': {
      const task = await findTaskByTitle(supabase, userId, String(args.title), false);
      if (!task) return 'tarefa não encontrada';
      await supabase
        .from('tasks')
        .update({ priority: String(args.priority), updated_at: new Date().toISOString() })
        .eq('id', task.id);
      return `prioridade de "${task.title}" definida como ${args.priority}`;
    }
    case 'toggle_automation': {
      const { data } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${args.name}%`)
        .limit(1);
      const auto = data?.[0];
      if (!auto) return 'automação não encontrada';
      await supabase.from('automations').update({ enabled: !auto.enabled }).eq('id', auto.id);
      return `automação "${auto.name}" ${!auto.enabled ? 'ativada' : 'desativada'}`;
    }
    default:
      return `ferramenta desconhecida: ${name}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const message = (body.message ?? '').toString().trim();
    if (!message) return json({ error: 'message required' }, 400);

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) return json({ error: 'OPENROUTER_API_KEY não configurada' }, 500);

    // Registra a mensagem do usuário (o realtime entrega ao app).
    await supabase.from('messages').insert({ user_id: user.id, role: 'user', text: message, narrate: false });

    // Carrega o contexto atual do usuário.
    const [settingsRes, tasksRes, autosRes, historyRes] = await Promise.all([
      supabase.from('settings').select('*').eq('user_id', user.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('automations').select('*').eq('user_id', user.id),
      supabase.from('messages').select('role,text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(16),
    ]);

    const settings = settingsRes.data ?? { preferred_model: 'claude' };
    const model = MODEL_MAP[settings.preferred_model] ?? MODEL_MAP.claude;

    const contextSummary = [
      'CONTEXTO ATUAL:',
      'Tarefas:',
      ...(tasksRes.data ?? []).map((t: SB) => `- [${t.status}] ${t.title} (prioridade ${t.priority})`),
      'Automações:',
      ...(autosRes.data ?? []).map((a: SB) => `- ${a.enabled ? 'ligada' : 'desligada'}: ${a.name} (${a.trigger})`),
    ].join('\n');

    const history = (historyRes.data ?? [])
      .reverse()
      .map((m: SB) => ({ role: m.role === 'hermes' ? 'assistant' : 'user', content: m.text }));

    const messages: SB[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextSummary}` },
      ...history,
    ];

    // Loop de tool-calling (até 4 rodadas).
    let finalText = '';
    let buttonsOut: { id: string; label: string; action: string; variant?: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const resp = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hermes.app',
          'X-Title': 'Hermes',
        },
        body: JSON.stringify({ model, messages, tools: TOOLS, tool_choice: 'auto' }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        finalText = `Não consegui falar com a IA agora (${resp.status}). Tente novamente.`;
        console.error('OpenRouter error', resp.status, errText);
        break;
      }

      const data = await resp.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) {
        finalText = 'Não recebi resposta da IA.';
        break;
      }

      messages.push(choice);

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length === 0) {
        finalText = choice.content ?? '';
        break;
      }

      const parseArgs = (call: SB): Record<string, unknown> => {
        try {
          return JSON.parse(call.function.arguments || '{}');
        } catch {
          return {};
        }
      };

      // present_options é uma resposta final: monta os botões de múltipla escolha e encerra.
      const optionCall = toolCalls.find((c: SB) => c.function.name === 'present_options');
      if (optionCall) {
        const args = parseArgs(optionCall);
        finalText = (args.text as string) ?? 'Escolha uma opção:';
        const options = Array.isArray(args.options) ? (args.options as unknown[]) : [];
        buttonsOut = options.slice(0, 4).map((o, idx) => ({
          id: `opt_${idx}`,
          label: String(o),
          action: String(o),
          variant: idx === 0 ? 'primary' : undefined,
        }));
        break;
      }

      for (const call of toolCalls) {
        const result = await runTool(supabase, user.id, call.function.name, parseArgs(call));
        messages.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
    }

    if (!finalText) finalText = 'Pronto.';

    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'hermes',
        text: finalText,
        buttons: buttonsOut.length ? buttonsOut : null,
        narrate: true,
      });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
