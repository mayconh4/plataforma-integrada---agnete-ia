import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/themes';
import { useStore } from '../store/AppStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { GlassView } from '../components/glass/GlassView';
import { configureVoice, stopSpeech, narrate } from '../services/voiceService';
import { applyAlwaysOn } from '../services/keepAlive';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string; hint: string }[] = [
  { mode: 'light', label: 'Claro', icon: '☀️', hint: 'Inspirado no Claude · liquid glass' },
  { mode: 'dark', label: 'Escuro', icon: '🌙', hint: 'Vidro translúcido profundo' },
  { mode: 'system', label: 'Sistema', icon: '⚙️', hint: 'Segue o aparelho' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GlassView radius={22} style={styles.card}>
      <Text style={[styles.cardTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      {children}
    </GlassView>
  );
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        {desc ? <Text style={[styles.rowDesc, { color: theme.textMuted }]}>{desc}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Stepper({ value, onChange, step, min, max, fmt }: { value: number; onChange: (v: number) => void; step: number; min: number; max: number; fmt: (v: number) => string }) {
  const { theme } = useTheme();
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v * 100) / 100)));
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => set(value - step)} style={[styles.stepBtn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
        <Text style={[styles.stepTxt, { color: theme.textPrimary }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepVal, { color: theme.textPrimary }]}>{fmt(value)}</Text>
      <Pressable onPress={() => set(value + step)} style={[styles.stepBtn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
        <Text style={[styles.stepTxt, { color: theme.textPrimary }]}>＋</Text>
      </Pressable>
    </View>
  );
}

export function ContaScreen({ onBack }: { onBack: () => void }) {
  const { theme, mode, setMode } = useTheme();
  const { data, updateSettings } = useStore();
  const s = data.settings;

  const setVoiceRate = (v: number) => {
    updateSettings({ voiceRate: v });
    configureVoice({ rate: v });
  };
  const setVoicePitch = (v: number) => {
    updateSettings({ voicePitch: v });
    configureVoice({ pitch: v });
  };
  const toggleVoice = (v: boolean) => {
    updateSettings({ voiceEnabled: v });
    configureVoice({ enabled: v });
    if (!v) stopSpeech();
  };
  const toggleAlwaysOn = (v: boolean) => {
    updateSettings({ alwaysOn: v });
    applyAlwaysOn(v).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const trackColor = { false: theme.glassBorder, true: theme.primary };

  return (
    <ScreenContainer
      title="Minha Conta"
      subtitle="Preferências, tema e voz"
      headerRight={
        <Pressable onPress={onBack} style={[styles.back, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]} hitSlop={8}>
          <Text style={[styles.backTxt, { color: theme.textSecondary }]}>Voltar</Text>
        </Pressable>
      }
    >
      <Card title="Perfil">
        <Row
          label="Seu nome"
          desc="Como a Viper te chama"
          right={
            <TextInput
              value={s.userName}
              onChangeText={(t) => updateSettings({ userName: t })}
              placeholder="Nome"
              placeholderTextColor={theme.textMuted}
              style={[styles.nameInput, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            />
          }
        />
      </Card>

      <Card title="Tema">
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const selected = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMode(opt.mode);
                }}
                style={[
                  styles.themeCard,
                  { borderColor: selected ? theme.primary : theme.glassBorder, backgroundColor: selected ? theme.primarySoft : theme.glass },
                ]}
              >
                <Text style={styles.themeIcon}>{opt.icon}</Text>
                <Text style={[styles.themeLabel, { color: selected ? theme.primary : theme.textPrimary }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.themeHint, { color: theme.textMuted }]}>
          {THEME_OPTIONS.find((o) => o.mode === mode)?.hint}
        </Text>
      </Card>

      <Card title="Voz da Viper">
        <Row
          label="Falar respostas"
          desc="Narração por voz"
          right={<Switch value={s.voiceEnabled} onValueChange={toggleVoice} trackColor={trackColor} thumbColor="#fff" />}
        />
        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
        <Row
          label="Narrar automaticamente"
          desc="Ler novas respostas ao chegar"
          right={
            <Switch
              value={s.autoNarrate}
              onValueChange={(v) => updateSettings({ autoNarrate: v })}
              trackColor={trackColor}
              thumbColor="#fff"
              disabled={!s.voiceEnabled}
            />
          }
        />
        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
        <Row label="Velocidade" right={<Stepper value={s.voiceRate} onChange={setVoiceRate} step={0.1} min={0.5} max={1.6} fmt={(v) => `${v.toFixed(1)}x`} />} />
        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
        <Row label="Tom" right={<Stepper value={s.voicePitch} onChange={setVoicePitch} step={0.1} min={0.7} max={1.4} fmt={(v) => v.toFixed(1)} />} />
        <Pressable
          onPress={() => narrate('preview_voice', `Olá ${s.userName || ''}, é assim que eu falo.`)}
          style={[styles.testBtn, { borderColor: theme.primary }]}
        >
          <Text style={[styles.testTxt, { color: theme.primary }]}>▶ Testar voz</Text>
        </Pressable>
      </Card>

      <Card title="Funcionamento">
        <Row
          label="Sempre ativo"
          desc="Continua trabalhando e falando com a tela apagada. Só para quando você fechar o app."
          right={<Switch value={s.alwaysOn} onValueChange={toggleAlwaysOn} trackColor={trackColor} thumbColor="#fff" />}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backTxt: { fontSize: 13, fontWeight: '600' },
  card: { padding: 18, marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12, opacity: 0.6 },
  nameInput: { minWidth: 120, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlign: 'right' },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeCard: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 6 },
  themeIcon: { fontSize: 24 },
  themeLabel: { fontSize: 13, fontWeight: '700' },
  themeHint: { fontSize: 12.5, marginTop: 12, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 19, fontWeight: '700' },
  stepVal: { fontSize: 15, fontWeight: '700', minWidth: 42, textAlign: 'center' },
  testBtn: { marginTop: 16, borderWidth: 1, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  testTxt: { fontSize: 14, fontWeight: '700' },
});
