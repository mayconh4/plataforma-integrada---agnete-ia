import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Skill } from '../../store/types';

/** Active skills with a load bar each — which skills the agent is running now. */
export function SkillBars({ skills }: { skills: Skill[] }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {skills.map((s) => (
        <View key={s.id}>
          <View style={styles.row}>
            <View style={styles.nameRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: s.active ? theme.online : theme.textMuted, shadowColor: theme.online },
                ]}
              />
              <Text style={[styles.name, { color: s.active ? theme.textPrimary : theme.textMuted }]}>{s.name}</Text>
            </View>
            <Text style={[styles.pct, { color: theme.textMuted }]}>
              {s.active ? `${Math.round(s.load * 100)}%` : 'inativa'}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.vizGrid }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round((s.active ? s.load : 0) * 100)}%`,
                  backgroundColor: s.active ? theme.primary : theme.textMuted,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.8, shadowRadius: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  pct: { fontSize: 12.5, fontWeight: '600' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
