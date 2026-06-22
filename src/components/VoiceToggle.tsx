import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { isVoiceEnabled, toggleVoice } from '../services/voiceService';

export function VoiceToggle() {
  const [enabled, setEnabled] = useState(isVoiceEnabled());

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = toggleVoice();
    setEnabled(newState);
  };

  return (
    <TouchableOpacity onPress={handleToggle} style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blur}>
        <View style={[styles.indicator, enabled && styles.indicatorActive]} />
        <Text style={styles.icon}>{enabled ? '🔊' : '🔇'}</Text>
        <Text style={styles.label}>{enabled ? 'VOZ' : 'MUDO'}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  indicatorActive: {
    backgroundColor: colors.accent,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
