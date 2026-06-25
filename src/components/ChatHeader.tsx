import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { GlassView } from './glass/GlassView';
import { configureVoice, stopSpeech } from '../services/voiceService';

interface Props {
  onSettings: () => void;
  onLogout?: () => void;
}

export function ChatHeader({ onSettings, onLogout }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, updateSettings } = useStore();
  const voiceOn = data.settings.voiceEnabled;

  const toggleVoice = () => {
    Haptics.selectionAsync().catch(() => {});
    const next = !voiceOn;
    updateSettings({ voiceEnabled: next });
    configureVoice({ enabled: next });
    if (!next) stopSpeech();
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft, borderColor: theme.glassBorder }]}>
          <Text style={styles.avatarTxt}>🐍</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: theme.textPrimary }]}>Viper</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: theme.online, shadowColor: theme.online }]} />
            <Text style={[styles.status, { color: theme.online }]}>Online</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable onPress={toggleVoice}>
          <GlassView radius={18} style={styles.voz}>
            <View style={[styles.vozDot, { backgroundColor: voiceOn ? theme.accent : theme.textMuted }]} />
            <Text style={styles.vozIcon}>{voiceOn ? '🔊' : '🔇'}</Text>
            <Text style={[styles.vozTxt, { color: theme.textSecondary }]}>{voiceOn ? 'VOZ' : 'MUDO'}</Text>
          </GlassView>
        </Pressable>

        <Pressable onPress={onSettings} style={[styles.iconBtn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
          <Text style={styles.iconTxt}>⚙️</Text>
        </Pressable>

        {onLogout && (
          <Pressable onPress={onLogout} style={[styles.sair, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
            <Text style={[styles.sairTxt, { color: theme.textSecondary }]}>Sair</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt: { fontSize: 20 },
  name: { fontSize: 19, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, shadowOpacity: 0.9, shadowRadius: 4 },
  status: { fontSize: 12, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voz: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  vozDot: { width: 6, height: 6, borderRadius: 3 },
  vozIcon: { fontSize: 13 },
  vozTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconTxt: { fontSize: 16 },
  sair: { paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  sairTxt: { fontSize: 13, fontWeight: '600' },
});
