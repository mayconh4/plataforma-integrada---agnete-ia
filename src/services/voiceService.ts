import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { getState, setVoiceEnabled as persistVoiceEnabled } from '../backend/store';
import { httpBaseUrl } from '../backend/connection';

// ---------------------------------------------------------------------------
// Voz: prioriza o áudio neural (edge-tts, vozes do Microsoft Edge) servido pelo
// backend em /tts. Se falhar (offline, sem URL), cai para a voz do Android.
// ---------------------------------------------------------------------------

let player: AudioPlayer | null = null;
let audioModeReady = false;

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
  Speech.speak(text, { language: 'pt-BR', rate: 0.95, pitch: 1.0 });
}

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

export function speak(text: string): void {
  if (!isVoiceEnabled()) return;
  const clean = (text || '').trim();
  if (!clean) return;

  const base = httpBaseUrl();
  if (!base) {
    speakWithDevice(clean);
    return;
  }

  void (async () => {
    try {
      await ensureAudioMode();
      stopSpeaking();
      const uri = `${base}/tts?text=${encodeURIComponent(clean)}`;
      player = createAudioPlayer({ uri });
      player.play();
    } catch {
      // Qualquer falha na voz neural → usa a voz do aparelho.
      speakWithDevice(clean);
    }
  })();
}

export function stopSpeaking(): void {
  Speech.stop();
  releasePlayer();
}
