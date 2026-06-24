import React from 'react';
import { StatusBar, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatScreen } from './src/screens/ChatScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useHermes } from './src/backend/useHermes';
import { colors } from './src/theme/colors';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.center}
    >
      {children}
    </LinearGradient>
  );
}

export default function App() {
  const { configured, ready, session } = useHermes();

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
          A URL do Hermes pode ser configurada dentro do app (⚙).
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
    content = <ChatScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  code: { color: colors.accent, fontWeight: '700' },
});
