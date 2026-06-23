// Helper para enviar push via Expo Push API (https://docs.expo.dev/push-notifications/sending-notifications/)

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Envia uma leva de mensagens de push. Falhas são logadas, não lançadas. */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    const resp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    if (!resp.ok) {
      console.error('Expo push error', resp.status, await resp.text());
    }
  } catch (e) {
    console.error('Expo push exception', e);
  }
}
