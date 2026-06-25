import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GlassView } from './glass/GlassView';

interface Props {
  icon?: string;
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
  style?: any;
}

/** A glass dashboard tile: emoji/icon, large value and a caption. */
export function StatCard({ icon, value, label, color, onPress, style }: Props) {
  const { theme } = useTheme();
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={style}>
      <GlassView radius={22} style={styles.card}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.value, { color: color ?? theme.textPrimary }]}>{value}</Text>
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      </GlassView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, minHeight: 116, justifyContent: 'space-between' },
  icon: { fontSize: 24 },
  value: { fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
