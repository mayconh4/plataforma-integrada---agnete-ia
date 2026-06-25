import { useEffect, useState, useCallback } from 'react';
import { SpeechState, subscribeSpeech, toggleSpeak, stopSpeaking } from '../services/voiceService';

/** Conecta um componente ao estado global de fala (só um texto toca por vez). */
export function useSpeech() {
  const [s, setS] = useState<SpeechState>({ id: null, status: 'idle' });
  useEffect(() => subscribeSpeech(setS), []);

  const statusFor = useCallback(
    (id: string): SpeechState['status'] => (s.id === id ? s.status : 'idle'),
    [s]
  );
  const toggle = useCallback((id: string, text: string) => toggleSpeak(id, text), []);

  return { activeId: s.id, status: s.status, statusFor, toggle, stop: () => stopSpeaking() };
}
