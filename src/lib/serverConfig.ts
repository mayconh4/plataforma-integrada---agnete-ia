import AsyncStorage from '@react-native-async-storage/async-storage';

// URL do servidor Hermes (WebSocket) configurável em runtime, salva no aparelho.
// Assim o APK não precisa ser rebuildado quando a URL do túnel muda.

const KEY = 'continental_ws_url';
let cached: string | null = null;

export function getCachedWsUrl(): string | null {
  return cached;
}

export async function loadWsUrl(): Promise<string | null> {
  try {
    cached = await AsyncStorage.getItem(KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export async function saveWsUrl(url: string): Promise<void> {
  cached = url.trim() || null;
  try {
    if (cached) await AsyncStorage.setItem(KEY, cached);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
