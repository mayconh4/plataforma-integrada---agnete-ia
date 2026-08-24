import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';

/**
 * Runs headlessly whenever a scheduled alert is delivered — even if the app
 * is fully closed and the screen is off. This is what makes Hermes "just
 * speak" without the user opening anything. Reliable on Android; iOS runs
 * it only while the OS allows background execution for the app, which is
 * more restrictive by platform design.
 */
export const BACKGROUND_NOTIFICATION_TASK = 'hermes-background-notification-task';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  const payload = data as { notification?: Notifications.Notification };
  const spokenText = payload?.notification?.request?.content?.data?.spokenText as
    | string
    | undefined;
  if (spokenText) {
    Speech.speak(spokenText, { language: 'pt-BR', rate: 1.0, pitch: 1.0 });
  }
});

/** Call once at app startup, before any alert can rely on it. */
export async function registerBackgroundVoiceTask(): Promise<void> {
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
  if (!alreadyRegistered) {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}
