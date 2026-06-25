import { useEffect, useState, useCallback } from 'react';
import {
  SpeechState,
  subscribeSpeech,
  toggleSpeech,
  stopSpeech,
} from '../services/voiceService';

/**
 * Subscribes a component to the global speech state. Returns the active id +
 * status plus a `toggle(id, text)` helper. Every play/pause button uses this so
 * they all stay perfectly in sync (only one text speaks at a time).
 */
export function useSpeech() {
  const [state, setState] = useState<SpeechState>({ id: null, status: 'idle' });

  useEffect(() => subscribeSpeech(setState), []);

  const toggle = useCallback((id: string, text: string) => toggleSpeech(id, text), []);

  const statusFor = useCallback(
    (id: string) => (state.id === id ? state.status : 'idle'),
    [state]
  );

  return {
    activeId: state.id,
    status: state.status,
    statusFor,
    toggle,
    stop: stopSpeech,
  };
}
