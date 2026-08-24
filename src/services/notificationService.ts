import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Every alert Hermes fires — pre-programmed routines and calendar reminders
 * alike — goes through here. The handler forces sound + banner even with
 * the screen off, and the response/received listeners are what let the app
 * speak the alert out loud without the user ever opening it.
 */

const CHANNEL_ID = 'hermes-alertas';
let permissionGranted = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Must be called once, with the user present, before any alert can fire.
 * This is the one unavoidable OS-level permission — after it's granted,
 * everything else in this module runs unattended.
 */
export async function requestAlertPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    permissionGranted = true;
  } else {
    const { granted } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    permissionGranted = granted;
  }

  if (permissionGranted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas do Hermes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      sound: 'default',
    });
  }
  return permissionGranted;
}

export function hasAlertPermission(): boolean {
  return permissionGranted;
}

interface AlertPayload {
  id: string;
  title: string;
  body: string;
}

/** Schedules a one-shot local alert to fire at an absolute date. */
export async function scheduleAlert(payload: AlertPayload, fireAt: Date): Promise<void> {
  if (!permissionGranted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: payload.id,
    content: {
      title: payload.title,
      body: payload.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { spokenText: payload.body },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
  });
}

export async function cancelAlert(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function cancelAllAlerts(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/**
 * Fires when an alert is delivered — screen on or off, app open or not —
 * as long as the process is alive (kept alive by the background task).
 * This is the hook that turns a silent push into Hermes speaking.
 */
export function onAlertDelivered(handler: (spokenText: string) => void): () => void {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const text = notification.request.content.data?.spokenText as string | undefined;
    if (text) handler(text);
  });
  return () => sub.remove();
}

/** Fires when the user taps a delivered alert (app opens or resumes). */
export function onAlertOpened(handler: (spokenText: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const text = response.notification.request.content.data?.spokenText as string | undefined;
    if (text) handler(text);
  });
  return () => sub.remove();
}
