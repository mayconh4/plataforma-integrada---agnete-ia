import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { mono } from '../theme/typography';
import { isVoiceEnabled, toggleVoice } from '../services/voiceService';

export function VoiceToggle() {
  const [enabled, setEnabled] = useState(isVoiceEnabled());

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnabled(toggleVoice());
  };

  const color = enabled ? colors.accent : colors.textMuted;

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={[styles.container, { borderColor: color }]}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{enabled ? 'VOZ:ON' : 'VOZ:OFF'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 6,
    // sharp corners — no borderRadius
  },
  indicator: {
    width: 7,
    height: 7,
    // square indicator
  },
  label: {
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
