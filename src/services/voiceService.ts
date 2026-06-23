import * as Speech from 'expo-speech';
import { getState, setVoiceEnabled as persistVoiceEnabled } from '../backend/store';

export function isVoiceEnabled(): boolean {
  return getState().settings.voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  void persistVoiceEnabled(enabled);
  if (!enabled) {
    Speech.stop();
  }
}

export function toggleVoice(): boolean {
  const next = !isVoiceEnabled();
  setVoiceEnabled(next);
  return next;
}

export function speak(text: string): void {
  if (!isVoiceEnabled()) return;
  Speech.stop();
  Speech.speak(text, {
    language: 'pt-BR',
    rate: 1.0,
    pitch: 1.0,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
