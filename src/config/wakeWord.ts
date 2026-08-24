import { Platform } from 'react-native';

/**
 * Wake-word ("continental") configuration.
 *
 * SETUP (one-time):
 *   1. Create a free account at https://console.picovoice.ai
 *   2. Copy your Access Key and paste it below (or set EXPO_PUBLIC_PICOVOICE_KEY).
 *   3. Train the custom keyword "continental" (Porcupine → Wake Word → type
 *      "continental", pick Portuguese, choose Android and iOS) and download the
 *      generated .ppn files.
 *   4. Place them in the native projects so Porcupine can read them by name:
 *        Android → android/app/src/main/assets/continental_android.ppn
 *        iOS     → add continental_ios.ppn to the app bundle (drag into Xcode)
 *      Then keep the file names below in sync.
 *
 * Until a real key is provided the wake-word service stays dormant and the app
 * works normally (text + button + manual voice).
 */

export const PICOVOICE_ACCESS_KEY =
  process.env.EXPO_PUBLIC_PICOVOICE_KEY ?? 'YOUR_PICOVOICE_ACCESS_KEY_HERE';

/** The spoken activation word. */
export const WAKE_WORD = 'continental';

/** Portuguese model file (download from Picovoice Console, same location). */
export const PORCUPINE_MODEL_PATH = Platform.select({
  android: 'porcupine_params_pt.pv',
  ios: 'porcupine_params_pt.pv',
  default: 'porcupine_params_pt.pv',
}) as string;

/** Platform-specific trained keyword file name (relative to native assets). */
export const KEYWORD_PATH = Platform.select({
  android: 'continental_android.ppn',
  ios: 'continental_ios.ppn',
  default: 'continental_android.ppn',
}) as string;

export function isWakeWordConfigured(): boolean {
  return (
    PICOVOICE_ACCESS_KEY !== 'YOUR_PICOVOICE_ACCESS_KEY_HERE' &&
    PICOVOICE_ACCESS_KEY.length > 0
  );
}
