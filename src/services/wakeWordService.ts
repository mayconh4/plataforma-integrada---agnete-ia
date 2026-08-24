import { PorcupineManager } from '@picovoice/porcupine-react-native';
import {
  PICOVOICE_ACCESS_KEY,
  KEYWORD_PATH,
  PORCUPINE_MODEL_PATH,
  isWakeWordConfigured,
} from '../config/wakeWord';

/**
 * Always-on "continental" wake-word listener (Picovoice Porcupine).
 *
 * Listens on-device for the single keyword only — no audio is recorded or
 * sent anywhere until the word is heard. When it fires, onWake() runs, and
 * the caller starts the actual conversation (speech-to-text + Hermes).
 *
 * Requires a development/production build with microphone permission; it is a
 * no-op in Expo Go or when not yet configured (see config/wakeWord.ts).
 */

let manager: PorcupineManager | null = null;
let running = false;

export function isWakeWordActive(): boolean {
  return running;
}

export interface WakeWordHandlers {
  onWake: () => void;
  onError?: (message: string) => void;
}

export async function startWakeWord(handlers: WakeWordHandlers): Promise<boolean> {
  if (running) return true;
  if (!isWakeWordConfigured()) {
    handlers.onError?.(
      'Wake word não configurada. Adicione a chave Picovoice e o arquivo continental.ppn.'
    );
    return false;
  }

  try {
    manager = await PorcupineManager.fromKeywordPaths(
      PICOVOICE_ACCESS_KEY,
      [KEYWORD_PATH],
      (keywordIndex: number) => {
        if (keywordIndex >= 0) handlers.onWake();
      },
      (error) => {
        handlers.onError?.(error?.message ?? 'Erro no detector de voz');
      },
      PORCUPINE_MODEL_PATH
    );
    await manager.start();
    running = true;
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Falha ao iniciar wake word';
    handlers.onError?.(msg);
    await stopWakeWord();
    return false;
  }
}

export async function stopWakeWord(): Promise<void> {
  running = false;
  if (manager) {
    try {
      await manager.stop();
      await manager.delete();
    } catch {
      // ignore teardown errors
    }
    manager = null;
  }
}
