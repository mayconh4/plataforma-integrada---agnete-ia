import AsyncStorage from '@react-native-async-storage/async-storage';

// Voz escolhida pelo usuário (vozes neurais do Edge), salva no aparelho.
// O app envia esse valor para o backend em /tts?voice=...

const KEY = 'continental_voice';

export interface VoiceOption {
  id: string;
  label: string;
  gender: 'f' | 'm';
}

// Vozes pt-BR disponíveis no edge-tts (Microsoft Edge).
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'pt-BR-FranciscaNeural', label: 'Francisca', gender: 'f' },
  { id: 'pt-BR-ThalitaMultilingualNeural', label: 'Thalita', gender: 'f' },
  { id: 'pt-BR-AntonioNeural', label: 'Antônio', gender: 'm' },
  { id: 'pt-BR-MacerioMultilingualNeural', label: 'Macério', gender: 'm' },
];

export const DEFAULT_VOICE = 'pt-BR-FranciscaNeural';

let cached = DEFAULT_VOICE;

export function getCachedVoice(): string {
  return cached;
}

export async function loadVoice(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v) cached = v;
  } catch {
    // mantém o padrão
  }
  return cached;
}

export async function saveVoice(voiceId: string): Promise<void> {
  cached = voiceId || DEFAULT_VOICE;
  try {
    await AsyncStorage.setItem(KEY, cached);
  } catch {
    // ignore
  }
}
