export type RoutineTrigger =
  | { kind: 'dailyTime'; hour: number; minute: number }
  | { kind: 'beforeEvent'; minutesBefore: number };

export interface Routine {
  id: string;
  /** Short internal name, e.g. "bom_dia". */
  name: string;
  trigger: RoutineTrigger;
  /** Builds the spoken/notified text; receives runtime data like event title. */
  buildMessage: (ctx: RoutineContext) => string;
  /** Only fires on these weekdays (0 = domingo). Omit for every day. */
  weekdays?: number[];
  enabled: boolean;
}

export interface RoutineContext {
  eventTitle?: string;
  eventTime?: Date;
  now: Date;
}

/** A calendar-like event the user (or an integration) registers ahead of time. */
export interface ScheduledEvent {
  id: string;
  title: string;
  /** Epoch ms of the event start. */
  startsAt: number;
  /** Minutes before the event to alert; defaults to 10. */
  alertMinutesBefore?: number;
}
