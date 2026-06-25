import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppStoreProvider, useStore } from './src/store/AppStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { configureVoice } from './src/services/voiceService';
import { applyAlwaysOn } from './src/services/keepAlive';

/** Applies persisted settings (voice + always-on) once data is hydrated. */
function Bootstrap() {
  const { ready, data } = useStore();
  const { ready: themeReady, theme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    const s = data.settings;
    configureVoice({ enabled: s.voiceEnabled, rate: s.voiceRate, pitch: s.voicePitch });
    applyAlwaysOn(s.alwaysOn).catch(() => {});
  }, [ready, data.settings]);

  if (!ready || !themeReady) {
    return <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />;
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppStoreProvider>
            <View style={styles.flex}>
              <Bootstrap />
            </View>
          </AppStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
