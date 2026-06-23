import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Como exibir notificações com o app em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Solicita permissão e obtém o Expo push token. Retorna null se indisponível. */
async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // emuladores não recebem push remoto

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Hermes',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('Push: projectId ausente (rode `eas init`). Push remoto desativado.');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.warn('Push: falha ao obter token', e);
    return null;
  }
}

/** Registra o token de push do dispositivo no Supabase (best-effort). */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await getPushToken();
    if (!token) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('push_tokens').upsert(
      { token, user_id: data.user.id, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );
  } catch (e) {
    console.warn('Push: registro falhou', e);
  }
}
