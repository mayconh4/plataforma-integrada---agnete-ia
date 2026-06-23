// ============================================================================
// Edge Function: scheduler
// ----------------------------------------------------------------------------
// Chamada pelo pg_cron a cada minuto (ver supabase/scheduler_cron.sql).
// Roda do lado do servidor MESMO COM O APP FECHADO:
//   1. Dispara automações cujo horário chegou (timezone America/Sao_Paulo).
//   2. Reativa tarefas adiadas cujo prazo passou.
// Em ambos os casos grava uma mensagem do Hermes e envia push notification.
//
// Segurança: exige o header x-cron-secret == CRON_SECRET.
// Secrets: CRON_SECRET. Injetados pelo Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ExpoPushMessage, sendExpoPush } from '../_shared/push.ts';

const TIMEZONE = 'America/Sao_Paulo';

// deno-lint-ignore no-explicit-any
type SB = any;

function nowInTz(): { hour: number; minute: number; dow: number; dateKey: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    dow: dowMap[parts.weekday as string] ?? 0,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function ranToday(lastRunAt: string | null): boolean {
  if (!lastRunAt) return false;
  const last = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(lastRunAt));
  const today = nowInTz().dateKey;
  return last === today;
}

async function tokensByUser(supabase: SB, userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (userIds.length === 0) return map;
  const { data } = await supabase.from('push_tokens').select('user_id, token').in('user_id', userIds);
  for (const row of data ?? []) {
    const list = map.get(row.user_id) ?? [];
    list.push(row.token);
    map.set(row.user_id, list);
  }
  return map;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok');

  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { hour, minute, dow } = nowInTz();
  const events: { user_id: string; text: string; title: string }[] = [];

  // --- 1. Automações no horário ---
  const { data: autos } = await supabase.from('automations').select('*').eq('enabled', true);
  for (const a of (autos ?? []) as SB[]) {
    if (a.schedule_hour == null) continue;
    if (a.schedule_hour !== hour || a.schedule_minute !== minute) continue;
    const days: number[] = a.schedule_days ?? [];
    if (days.length > 0 && !days.includes(dow)) continue;
    if (ranToday(a.last_run_at)) continue;

    await supabase
      .from('automations')
      .update({ last_run_at: new Date().toISOString(), runs: (a.runs ?? 0) + 1 })
      .eq('id', a.id);

    const text = `⚡ Automação executada: "${a.name}".`;
    await supabase.from('messages').insert({ user_id: a.user_id, role: 'hermes', text, narrate: false });
    events.push({ user_id: a.user_id, title: 'Hermes', text });
  }

  // --- 2. Tarefas adiadas cujo prazo passou ---
  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'deferred')
    .lte('defer_until', nowIso);

  for (const t of (due ?? []) as SB[]) {
    await supabase
      .from('tasks')
      .update({ status: 'pending', defer_until: null, updated_at: nowIso })
      .eq('id', t.id);

    const text = `⏰ A tarefa "${t.title}" voltou para pendentes.`;
    await supabase.from('messages').insert({ user_id: t.user_id, role: 'hermes', text, narrate: false });
    events.push({ user_id: t.user_id, title: 'Hermes', text });
  }

  // --- 3. Envia push para os usuários afetados ---
  const userIds = [...new Set(events.map((e) => e.user_id))];
  const tokenMap = await tokensByUser(supabase, userIds);
  const pushes: ExpoPushMessage[] = [];
  for (const ev of events) {
    for (const token of tokenMap.get(ev.user_id) ?? []) {
      pushes.push({ to: token, title: ev.title, body: ev.text, sound: 'default' });
    }
  }
  await sendExpoPush(pushes);

  return new Response(JSON.stringify({ ok: true, events: events.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
