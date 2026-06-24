import * as Speech from 'expo-speech';
import { getState, setVoiceEnabled as persistVoiceEnabled } from '../backend/store';

let cachedVoiceId: string | null | undefined = undefined; // undefined = not yet resolved

async function getBestPtBrVoice(): Promise<string | undefined> {
  if (cachedVoiceId !== undefined) return cachedVoiceId ?? undefined;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const ptVoices = voices.filter(
      (v) => v.language?.toLowerCase().startsWith('pt') && v.quality !== undefined,
    );
    // Prefer enhanced/network quality (neural voices)
    const neural = ptVoices.find((v) => (v.quality as number) >= 500);
    const best = neural ?? ptVoices[0];
    cachedVoiceId = best?.identifier ?? null;
  } catch {
    cachedVoiceId = null;
  }
  return cachedVoiceId ?? undefined;
}

// Warm up voice cache on module load
void getBestPtBrVoice();

export function isVoiceEnabled(): boolean {
  return getState().settings.voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  void persistVoiceEnabled(enabled);
  if (!enabled) Speech.stop();
}

export function toggleVoice(): boolean {
  const next = !isVoiceEnabled();
  setVoiceEnabled(next);
  return next;
}

export function speak(text: string): void {
  if (!isVoiceEnabled()) return;
  Speech.stop();
  void getBestPtBrVoice().then((voiceId) => {
    Speech.speak(text, {
      language: 'pt-BR',
      voice: voiceId,
      rate: 0.95,
      pitch: 1.0,
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
