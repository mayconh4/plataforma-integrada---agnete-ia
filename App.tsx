import 'react-native-gesture-handler';
import React, { useEffect, useMemo } from 'react';
import { StatusBar, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MainScreen } from './src/screens/MainScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useHermes } from './src/backend/useHermes';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { Palette } from './src/theme/colors';
import { loadAlwaysOn } from './src/lib/appPrefs';
import { applyAlwaysOn } from './src/services/keepAlive';

function Centered({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.center}>
      {children}
    </LinearGradient>
  );
}

function AppInner() {
  const { colors, name } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { configured, ready, session } = useHermes();

  // Restaura o "sempre ativo" salvo.
  useEffect(() => {
    loadAlwaysOn().then((on) => {
      if (on) applyAlwaysOn(true).catch(() => {});
    });
  }, []);

  let content: React.ReactNode;
  if (!configured) {
    content = (
      <Centered>
        <Text style={styles.title}>Configuração necessária</Text>
        <Text style={styles.body}>
          Crie um arquivo <Text style={styles.code}>.env</Text> com:{'\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text>{'\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>{'\n'}
          depois reinicie o app. Veja o SETUP.md.{'\n\n'}
          A URL da Viper pode ser configurada dentro do app (⚙).
        </Text>
      </Centered>
    );
  } else if (!ready) {
    content = (
      <Centered>
        <ActivityIndicator color={colors.primary} size="large" />
      </Centered>
    );
  } else if (!session) {
    content = <AuthScreen />;
  } else {
    content = <MainScreen />;
  }

  return (
    <>
      <StatusBar barStyle={name === 'light' ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />
      {content}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
    body: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    code: { color: colors.accent, fontWeight: '700' },
  });
