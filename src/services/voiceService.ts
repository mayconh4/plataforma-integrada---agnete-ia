import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { getState, setVoiceEnabled as persistVoiceEnabled } from '../backend/store';
import { httpBaseUrl } from '../backend/connection';
import { getCachedVoice } from '../lib/voicePref';
import { cleanForSpeech } from '../lib/textFormat';

// ---------------------------------------------------------------------------
// Voz: prioriza o áudio neural (edge-tts, vozes do Microsoft Edge) servido pelo
// backend em /tts. Se falhar (offline, sem URL), cai para a voz do Android.
//
// Mantém um estado global de reprodução (qual texto está tocando) para que os
// botões de play/pause espalhados pelo app fiquem em sincronia — só um texto
// fala por vez.
// ---------------------------------------------------------------------------

export type SpeechStatus = 'idle' | 'playing' | 'paused';
export interface SpeechState {
  id: string | null;
  status: SpeechStatus;
}

const supportsDevicePause = Platform.OS === 'ios' || Platform.OS === 'web';

let player: AudioPlayer | null = null;
let usingDevice = false; // a fala atual saiu pela voz do aparelho (não neural)
let audioModeReady = false;

let state: SpeechState = { id: null, status: 'idle' };
const listeners = new Set<(s: SpeechState) => void>();

function emit() {
  const snap = { ...state };
  listeners.forEach((l) => l(snap));
}
function setState(patch: Partial<SpeechState>) {
  state = { ...state, ...patch };
  emit();
}

export function getSpeechState(): SpeechState {
  return { ...state };
}
export function subscribeSpeech(listener: (s: SpeechState) => void): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeReady = true;
  } catch {
    // segue mesmo assim
  }
}

function releasePlayer(): void {
  if (player) {
    try {
      player.remove();
    } catch {
      // ignore
    }
    player = null;
  }
}

function speakWithDevice(text: string): void {
  Speech.stop();
  usingDevice = true;
  Speech.speak(text, {
    language: 'pt-BR',
    rate: 0.95,
    pitch: 1.0,
    onDone: () => {
      if (usingDevice) setState({ id: null, status: 'idle' });
    },
    onStopped: () => {
      if (usingDevice && state.status !== 'paused') setState({ id: null, status: 'idle' });
    },
  });
}

/** Inicia a reprodução de um texto, marcando-o como ativo (id). */
function start(id: string, raw: string): void {
  const clean = cleanForSpeech(raw || '').trim();
  if (!clean) return;

  stopSpeaking(true);
  setState({ id, status: 'playing' });

  const base = httpBaseUrl();
  if (!base) {
    speakWithDevice(clean);
    return;
  }

  usingDevice = false;
  void (async () => {
    try {
      await ensureAudioMode();
      const uri = `${base}/tts?text=${encodeURIComponent(clean)}&voice=${encodeURIComponent(getCachedVoice())}`;
      player = createAudioPlayer({ uri });
      player.addListener('playbackStatusUpdate', (s) => {
        if (s.didJustFinish && state.id === id) setState({ id: null, status: 'idle' });
      });
      player.play();
    } catch {
      speakWithDevice(clean); // qualquer falha → voz do aparelho
    }
  })();
}

/** Play/pause/retoma para um texto específico (usado pelos botões de fala). */
export function toggleSpeak(id: string, text: string): void {
  if (!isVoiceEnabled()) return;

  if (state.id === id && state.status === 'playing') {
    if (usingDevice) {
      if (supportsDevicePause) {
        Speech.pause();
        setState({ status: 'paused' });
      } else {
        Speech.stop();
        setState({ id: null, status: 'idle' });
      }
    } else if (player) {
      player.pause();
      setState({ status: 'paused' });
    }
    return;
  }

  if (state.id === id && state.status === 'paused') {
    if (usingDevice) {
      if (supportsDevicePause) {
        Speech.resume();
        setState({ status: 'playing' });
      } else {
        start(id, text);
      }
    } else if (player) {
      player.play();
      setState({ status: 'playing' });
    }
    return;
  }

  start(id, text);
}

/** Narração disparada automaticamente (nova resposta da Viper). */
export function narrate(id: string, text: string): void {
  if (!isVoiceEnabled()) return;
  start(id, text);
}

/** Fala simples sem rastrear estado (ex.: prévia de voz). */
export function speak(text: string): void {
  if (!isVoiceEnabled()) return;
  start('preview', text);
}

export function stopSpeaking(silent = false): void {
  Speech.stop();
  releasePlayer();
  usingDevice = false;
  if (!silent) setState({ id: null, status: 'idle' });
  else {
    state = { id: null, status: 'idle' };
  }
}

// --- Liga/desliga a voz (persistido no backend) ----------------------------

export function isVoiceEnabled(): boolean {
  return getState().settings.voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  void persistVoiceEnabled(enabled);
  if (!enabled) stopSpeaking();
}

export function toggleVoice(): boolean {
  const next = !isVoiceEnabled();
  setVoiceEnabled(next);
  return next;
}
