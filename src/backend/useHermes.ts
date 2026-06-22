import { useEffect, useState } from 'react';
import { getState, init, subscribe } from './store';
import { HermesState } from './types';

/**
 * Hook que conecta um componente ao estado do backend do Hermes.
 * Dispara o init() (idempotente) e re-renderiza a cada mudança de estado.
 */
export function useHermes(): HermesState {
  const [snapshot, setSnapshot] = useState<HermesState>(getState);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribe(() => {
      if (mounted) setSnapshot(getState());
    });
    void init().then(() => {
      if (mounted) setSnapshot(getState());
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return snapshot;
}
