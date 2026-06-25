import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

/** Lista rotulada (forças / fraquezas / melhorias / baixo valor). */
export function IntelList({ title, icon, color, items, emptyText = 'Nada por aqui ainda.' }: { title: string; icon: string; color: string; items: string[]; emptyText?: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{emptyText}</Text>
      ) : (
        <View style={{ gap: 8, marginTop: 4 }}>
          {items.map((it, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: color }]} />
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>{it}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  title: { fontSize: 15, fontWeight: '700' },
  empty: { fontSize: 13, marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  itemText: { flex: 1, fontSize: 13.5, lineHeight: 20 },
});
