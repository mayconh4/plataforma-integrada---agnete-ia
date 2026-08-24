/**
 * Speech-to-text for the conversation that follows the wake word.
 * Uses expo-speech-recognition (native build only). In Expo Go / web the
 * module is absent, so start() reports unavailable and the app falls back to
 * typed input.
 */
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type {
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';

export interface SpeechCallbacks {
  onPartial?: (text: string) => void;
  onResult: (text: string) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

let listening = false;
let subs: { remove: () => void }[] = [];

export function isListening(): boolean {
  return listening;
}

export async function startListening(cb: SpeechCallbacks): Promise<boolean> {
  if (listening) return true;
  try {
    const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perms.granted) {
      cb.onError?.('Permissão de microfone negada');
      return false;
    }

    subs = [
      ExpoSpeechRecognitionModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript) return;
        if (event.isFinal) cb.onResult(transcript);
        else cb.onPartial?.(transcript);
      }),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        listening = false;
        cleanup();
        cb.onEnd?.();
      }),
      ExpoSpeechRecognitionModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
        listening = false;
        cleanup();
        cb.onError?.(event.message ?? 'Erro no reconhecimento de fala');
      }),
    ];

    ExpoSpeechRecognitionModule.start({
      lang: 'pt-BR',
      interimResults: true,
      continuous: false,
    });
    listening = true;
    return true;
  } catch {
    cleanup();
    cb.onError?.('Reconhecimento de voz indisponível (requer build de desenvolvimento)');
    return false;
  }
}

export function stopListening(): void {
  if (!listening) return;
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // module unavailable
  }
  listening = false;
}

function cleanup(): void {
  subs.forEach((s) => s.remove());
  subs = [];
}
