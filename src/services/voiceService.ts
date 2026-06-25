import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Central text-to-speech controller with per-utterance state so any number of
 * "play/pause" buttons across the app can reflect exactly which text is speaking.
 *
 * Cross-platform note: `Speech.pause()` / `Speech.resume()` only exist on iOS and
 * web. On Android we degrade gracefully — "pause" stops playback and "play"
 * restarts the utterance from the beginning (the text is re-supplied via toggle).
 */

export type SpeechStatus = 'idle' | 'playing' | 'paused';

export interface SpeechState {
  /** id of the text currently engaged, or null. */
  id: string | null;
  status: SpeechStatus;
}

const supportsPauseResume = Platform.OS === 'ios' || Platform.OS === 'web';

let state: SpeechState = { id: null, status: 'idle' };
const listeners = new Set<(s: SpeechState) => void>();

let config = { enabled: true, rate: 1.0, pitch: 1.0, language: 'pt-BR' };

function emit() {
  const snapshot = { ...state };
  listeners.forEach((l) => l(snapshot));
}

function setState(next: Partial<SpeechState>) {
  state = { ...state, ...next };
  emit();
}

export function configureVoice(patch: Partial<typeof config>) {
  config = { ...config, ...patch };
  if (!config.enabled) {
    Speech.stop();
    setState({ id: null, status: 'idle' });
  }
}

export function getVoiceConfig() {
  return { ...config };
}

export function getSpeechState(): SpeechState {
  return { ...state };
}

export function subscribeSpeech(listener: (s: SpeechState) => void): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

function startSpeaking(id: string, text: string) {
  Speech.stop();
  setState({ id, status: 'playing' });
  Speech.speak(text, {
    language: config.language,
    rate: config.rate,
    pitch: config.pitch,
    onDone: () => {
      if (state.id === id) setState({ id: null, status: 'idle' });
    },
    onStopped: () => {
      // Only clear if we didn't intentionally move to "paused".
      if (state.id === id && state.status !== 'paused') {
        setState({ id: null, status: 'idle' });
      }
    },
    onError: () => {
      if (state.id === id) setState({ id: null, status: 'idle' });
    },
  });
}

/**
 * The single entry point most UI uses: toggles between play / pause / resume for
 * a given text. Tapping a different text interrupts the current one.
 */
export function toggleSpeech(id: string, text: string) {
  if (!config.enabled) return;

  if (state.id === id && state.status === 'playing') {
    if (supportsPauseResume) {
      setState({ status: 'paused' });
      Speech.pause();
    } else {
      Speech.stop();
      setState({ id: null, status: 'idle' });
    }
    return;
  }

  if (state.id === id && state.status === 'paused') {
    if (supportsPauseResume) {
      setState({ status: 'playing' });
      Speech.resume();
    } else {
      startSpeaking(id, text);
    }
    return;
  }

  startSpeaking(id, text);
}

/** Fire-and-forget narration (e.g. auto-narrate a new agent reply). */
export function narrate(id: string, text: string) {
  if (!config.enabled) return;
  startSpeaking(id, text);
}

export function stopSpeech() {
  Speech.stop();
  setState({ id: null, status: 'idle' });
}
