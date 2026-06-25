import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn, signUp } from '../backend/store';
import { useHermes } from '../backend/useHermes';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { authError } = useHermes();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🐍</Text>
          <Text style={styles.brandTitle}>Viper</Text>
          <Text style={styles.brandSubtitle}>Seu sistema operacional pessoal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{mode === 'signin' ? 'Entrar' : 'Criar conta'}</Text>

          <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.textMuted} secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} returnKeyType="go" />

          {authError ? <Text style={styles.error}>{authError}</Text> : null}

          <TouchableOpacity style={[styles.button, (!email.trim() || !password || busy) && styles.buttonDisabled]} onPress={submit} disabled={!email.trim() || !password || busy}>
            {busy ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.buttonText}>{mode === 'signin' ? 'Entrar' : 'Cadastrar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.switch}>
            <Text style={styles.switchText}>{mode === 'signin' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    brand: { alignItems: 'center', marginBottom: 32 },
    brandIcon: { fontSize: 48 },
    brandTitle: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginTop: 8 },
    brandSubtitle: { color: colors.textMuted, fontSize: 13, letterSpacing: 1, marginTop: 2 },
    card: { backgroundColor: colors.glassBg, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder, padding: 20 },
    cardTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 16 },
    input: { backgroundColor: colors.glassBg, borderRadius: 14, borderWidth: 1, borderColor: colors.glassBorder, color: colors.textPrimary, fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
    error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
    button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
    switch: { alignItems: 'center', marginTop: 16 },
    switchText: { color: colors.textSecondary, fontSize: 14 },
  });
