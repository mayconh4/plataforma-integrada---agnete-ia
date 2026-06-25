import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Skill } from '../../intel/types';

/** Skills ativas com barra de carga — o que o agente está executando. */
export function SkillBars({ skills }: { skills: Skill[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {skills.map((s) => (
        <View key={s.id}>
          <View style={styles.row}>
            <View style={styles.nameRow}>
              <View style={[styles.dot, { backgroundColor: s.active ? colors.online : colors.textMuted }]} />
              <Text style={[styles.name, { color: s.active ? colors.textPrimary : colors.textMuted }]}>{s.name}</Text>
            </View>
            <Text style={[styles.pct, { color: colors.textMuted }]}>{s.active ? `${Math.round(s.load * 100)}%` : 'inativa'}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.vizGrid }]}>
            <View style={[styles.fill, { width: `${Math.round((s.active ? s.load : 0) * 100)}%`, backgroundColor: s.active ? colors.primary : colors.textMuted }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  pct: { fontSize: 12.5, fontWeight: '600' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
