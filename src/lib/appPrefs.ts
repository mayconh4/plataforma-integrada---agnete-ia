import AsyncStorage from '@react-native-async-storage/async-storage';

/** Preferências locais simples (fora do Supabase). */

const ALWAYS_ON = '@viper/always-on';

export async function loadAlwaysOn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ALWAYS_ON)) === '1';
  } catch {
    return false;
  }
}

export function saveAlwaysOn(on: boolean): void {
  AsyncStorage.setItem(ALWAYS_ON, on ? '1' : '0').catch(() => {});
}
