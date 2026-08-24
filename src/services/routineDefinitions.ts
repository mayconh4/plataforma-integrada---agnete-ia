import { Routine, RoutineContext } from '../types/routines';

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Bom dia, senhor';
  if (h < 18) return 'Boa tarde, senhor';
  return 'Boa noite, senhor';
}

/**
 * Pre-programmed daily routines. Add new ones here — routineScheduler picks
 * them all up automatically and re-schedules them every day.
 */
export const ROUTINES: Routine[] = [
  {
    id: 'bom_dia',
    name: 'bom_dia',
    trigger: { kind: 'dailyTime', hour: 7, minute: 30 },
    enabled: true,
    buildMessage: (ctx: RoutineContext) => `${greeting(ctx.now)}. Já tomou seu café hoje?`,
  },
  {
    id: 'pausa_almoco',
    name: 'pausa_almoco',
    trigger: { kind: 'dailyTime', hour: 12, minute: 0 },
    enabled: true,
    buildMessage: () => 'Olá, senhor. Está na hora do almoço, não esqueça de fazer uma pausa.',
  },
  {
    id: 'fim_de_expediente',
    name: 'fim_de_expediente',
    trigger: { kind: 'dailyTime', hour: 18, minute: 30 },
    enabled: true,
    weekdays: [1, 2, 3, 4, 5],
    buildMessage: () => 'Boa noite, senhor. O expediente está terminando, deseja um resumo do dia?',
  },
  {
    id: 'hidratacao',
    name: 'hidratacao',
    trigger: { kind: 'dailyTime', hour: 15, minute: 0 },
    enabled: true,
    buildMessage: () => 'Só um lembrete rápido: já bebeu água nas últimas horas?',
  },
  {
    id: 'reuniao_lembrete',
    name: 'reuniao_lembrete',
    trigger: { kind: 'beforeEvent', minutesBefore: 10 },
    enabled: true,
    buildMessage: (ctx) =>
      `Olá, senhor. Você tem "${ctx.eventTitle ?? 'um compromisso'}" em ${
        ctx.eventTime ? Math.round((ctx.eventTime.getTime() - ctx.now.getTime()) / 60000) : 10
      } minutos.`,
  },
];
