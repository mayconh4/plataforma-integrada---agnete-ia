import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';
import { toggleVoice } from '../services/voiceService';
import { useHermes } from '../backend/useHermes';

export function VoiceToggle() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const enabled = useHermes().settings.voiceEnabled;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleVoice();
  };

  return (
    <TouchableOpacity onPress={handleToggle} style={styles.container}>
      <BlurView intensity={30} tint={colors.blurTint} style={styles.blur}>
        <View style={[styles.indicator, enabled && styles.indicatorActive]} />
        <Text style={styles.icon}>{enabled ? '🔊' : '🔇'}</Text>
        <Text style={styles.label}>{enabled ? 'VOZ' : 'MUDO'}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
    blur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
    indicatorActive: { backgroundColor: colors.accent },
    icon: { fontSize: 14 },
    label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  });
