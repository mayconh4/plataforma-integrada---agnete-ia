import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Priority } from '../store/types';
import { PRIORITY_LABEL, priorityColor } from '../utils/priority';

export function PriorityBadge({ priority, prefix }: { priority: Priority; prefix?: string }) {
  const { theme } = useTheme();
  const color = priorityColor(theme, priority);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color: theme.textMuted }]}>
        {prefix ? `${prefix} ` : ''}
        {PRIORITY_LABEL[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { fontSize: 12.5, fontWeight: '600' },
});
