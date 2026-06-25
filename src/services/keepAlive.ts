import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { setAudioModeAsync } from 'expo-audio';

/**
 * "Always On" mode — keeps Viper working at full power with the screen off:
 *  - keep-awake stops the OS from suspending the JS engine / dimming the device,
 *  - the audio session is configured to keep playing (speech) in the background
 *    and even in silent mode, mixing with other audio.
 *
 * Platform reality: full, unrestricted background CPU on a *locked* device
 * requires a native foreground service (a custom dev build), which is out of
 * scope for Expo Go. This combination keeps the app alive and speaking for as
 * long as the process is running, and stops only when the user closes the app.
 */

const TAG = 'viper-always-on';
let enabled = false;

export function isAlwaysOnEnabled() {
  return enabled;
}

export async function enableAlwaysOn(): Promise<void> {
  enabled = true;
  try {
    await activateKeepAwakeAsync(TAG);
  } catch {
    /* keep-awake unavailable on this platform */
  }
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    /* audio session config best-effort */
  }
}

export async function disableAlwaysOn(): Promise<void> {
  enabled = false;
  try {
    await deactivateKeepAwake(TAG);
  } catch {
    /* ignore */
  }
  try {
    await setAudioModeAsync({ shouldPlayInBackground: false });
  } catch {
    /* ignore */
  }
}

export async function applyAlwaysOn(on: boolean): Promise<void> {
  return on ? enableAlwaysOn() : disableAlwaysOn();
}
