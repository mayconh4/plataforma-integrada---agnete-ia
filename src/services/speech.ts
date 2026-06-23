import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

/**
 * Hook de entrada por voz (speech-to-text) usando expo-speech-recognition.
 * Reconhecimento on-device, em pt-BR. Requer dev build/APK (não funciona no Expo Go).
 */
export function useVoiceInput(onFinalText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    setPartial(transcript);
    if (event.isFinal && transcript.trim()) {
      onFinalText(transcript.trim());
      setPartial('');
    }
  });

  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => setListening(false));

  const start = useCallback(async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      setPartial('');
      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: true,
        continuous: false,
      });
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  return { listening, partial, start, stop };
}
