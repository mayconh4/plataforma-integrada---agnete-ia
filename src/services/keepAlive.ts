import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { setAudioModeAsync } from 'expo-audio';

/**
 * "Sempre ativo": mantém a Viper trabalhando com a tela apagada —
 *  - keep-awake impede o SO de suspender o app / apagar a tela,
 *  - a sessão de áudio toca em background e em modo silencioso (a fala continua).
 *
 * Limite de plataforma: CPU irrestrita com o aparelho *bloqueado* exigiria um
 * foreground service nativo (build customizado), fora do Expo Go. Esta combinação
 * mantém o app vivo e falando enquanto o processo existir; só para ao fechar o app.
 */

const TAG = 'viper-always-on';
let on = false;

export function isAlwaysOnEnabled(): boolean {
  return on;
}

export async function enableAlwaysOn(): Promise<void> {
  on = true;
  try {
    await activateKeepAwakeAsync(TAG);
  } catch {
    /* indisponível nesta plataforma */
  }
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
  } catch {
    /* best-effort */
  }
}

export async function disableAlwaysOn(): Promise<void> {
  on = false;
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

export async function applyAlwaysOn(enabled: boolean): Promise<void> {
  return enabled ? enableAlwaysOn() : disableAlwaysOn();
}
