import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { ROUTINES } from './routineDefinitions';
import { ScheduledEvent } from '../types/routines';
import { requestAlertPermission, scheduleAlert, cancelAlert } from './notificationService';
import { registerBackgroundVoiceTask } from './backgroundVoiceTask';

const EVENTS_KEY = '@hermes/scheduled_events';
const REFRESH_TASK = 'hermes-refresh-routines-task';
const HORIZON_DAYS = 2;

TaskManager.defineTask(REFRESH_TASK, async () => {
  await scheduleUpcomingAlerts();
  return BackgroundTask.BackgroundTaskResult.Success;
});

/** Call once at app startup: grants permission (if needed), wires the
 *  headless speaking task, schedules the next batch of alerts, and keeps
 *  scheduling fresh via a periodic background refresh. */
export async function initRoutines(): Promise<void> {
  const granted = await requestAlertPermission();
  if (!granted) return;

  await registerBackgroundVoiceTask();
  await scheduleUpcomingAlerts();

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(REFRESH_TASK);
  if (!alreadyRegistered) {
    await BackgroundTask.registerTaskAsync(REFRESH_TASK, {
      minimumInterval: 15,
    });
  }
}

export async function addScheduledEvent(event: ScheduledEvent): Promise<void> {
  const events = await loadEvents();
  events.push(event);
  await saveEvents(events);
  await scheduleUpcomingAlerts();
}

export async function removeScheduledEvent(id: string): Promise<void> {
  const events = (await loadEvents()).filter((e) => e.id !== id);
  await saveEvents(events);
  await cancelAlert(`event_${id}`);
}

async function loadEvents(): Promise<ScheduledEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveEvents(events: ScheduledEvent[]): Promise<void> {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

/** (Re)schedules every daily routine and calendar-event alert for the next
 *  HORIZON_DAYS. Safe to call repeatedly — identifiers are stable per
 *  occurrence, so re-scheduling the same slot just overwrites it. */
export async function scheduleUpcomingAlerts(): Promise<void> {
  const now = new Date();

  for (const routine of ROUTINES) {
    if (!routine.enabled) continue;

    for (let dayOffset = 0; dayOffset < HORIZON_DAYS; dayOffset++) {
      if (routine.trigger.kind !== 'dailyTime') continue;

      const fireAt = new Date(now);
      fireAt.setDate(now.getDate() + dayOffset);
      fireAt.setHours(routine.trigger.hour, routine.trigger.minute, 0, 0);
      if (fireAt.getTime() <= now.getTime()) continue;

      if (routine.weekdays && !routine.weekdays.includes(fireAt.getDay())) continue;

      const id = `routine_${routine.id}_${fireAt.toISOString().slice(0, 10)}`;
      const text = routine.buildMessage({ now: fireAt });
      await scheduleAlert({ id, title: 'Hermes', body: text }, fireAt);
    }
  }

  const events = await loadEvents();
  for (const event of events) {
    const alertMinutes = event.alertMinutesBefore ?? 10;
    const fireAt = new Date(event.startsAt - alertMinutes * 60_000);
    if (fireAt.getTime() <= now.getTime()) continue;

    const routine = ROUTINES.find((r) => r.trigger.kind === 'beforeEvent');
    const text =
      routine?.buildMessage({
        now,
        eventTitle: event.title,
        eventTime: new Date(event.startsAt),
      }) ?? `Você tem "${event.title}" em ${alertMinutes} minutos.`;

    await scheduleAlert({ id: `event_${event.id}`, title: 'Hermes', body: text }, fireAt);
  }
}
