import { useEffect, useState } from 'react';
import { getState, HermesUiState, init, subscribe } from './store';

/**
 * Hook que conecta um componente ao estado do backend do Hermes (Supabase).
 * Dispara o init() (idempotente) e re-renderiza a cada mudança de estado.
 */
export function useHermes(): HermesUiState {
  const [snapshot, setSnapshot] = useState<HermesUiState>(getState);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribe(() => {
      if (mounted) setSnapshot(getState());
    });
    void init();
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return snapshot;
}
