import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ChatScreen } from './src/screens/ChatScreen';
import { initRoutines } from './src/services/routineScheduler';
import { onAlertDelivered, onAlertOpened } from './src/services/notificationService';
import { attachAlertNarration } from './src/services/voiceService';
import './src/services/backgroundVoiceTask';

export default function App() {
  useEffect(() => {
    initRoutines();
    const detach = attachAlertNarration(onAlertDelivered, onAlertOpened);
    return detach;
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ChatScreen />
    </>
  );
}
