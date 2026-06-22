import AsyncStorage from '@react-native-async-storage/async-storage';
import { HermesState } from './types';

const STORAGE_KEY = 'hermes_state_v1';

/** Lê o estado persistido. Retorna null se não houver nada salvo ou em caso de erro. */
export async function loadState(): Promise<Partial<HermesState> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<HermesState>;
  } catch {
    return null;
  }
}

/** Persiste o estado completo. Falhas são silenciosas para não quebrar a UX. */
export async function saveState(state: HermesState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore — persistência é best-effort
  }
}

/** Apaga todo o estado persistido (usado pelo reset). */
export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
