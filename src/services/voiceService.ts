import * as Speech from 'expo-speech';

let voiceEnabled = true;

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  if (!enabled) {
    Speech.stop();
  }
}

export function toggleVoice(): boolean {
  voiceEnabled = !voiceEnabled;
  if (!voiceEnabled) {
    Speech.stop();
  }
  return voiceEnabled;
}

export function speak(text: string): void {
  if (!voiceEnabled) return;
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

/** Wires delivered/opened alerts to speech while the JS engine is alive
 *  (foreground or backgrounded-but-not-killed). Fully-closed-app delivery
 *  is handled separately by backgroundVoiceTask's headless task. */
export function attachAlertNarration(
  onAlertDelivered: (handler: (text: string) => void) => () => void,
  onAlertOpened: (handler: (text: string) => void) => () => void
): () => void {
  const unsubDelivered = onAlertDelivered((text) => speak(text));
  const unsubOpened = onAlertOpened((text) => speak(text));
  return () => {
    unsubDelivered();
    unsubOpened();
  };
}
