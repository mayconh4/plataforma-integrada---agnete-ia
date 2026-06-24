import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export type TabKey = 'resumo' | 'tarefas' | 'viper' | 'projetos' | 'metas';

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: 'resumo', label: 'Resumo', icon: '📊' },
  { key: 'tarefas', label: 'Tarefas', icon: '✅' },
  { key: 'viper', label: '', icon: '🎙️' },
  { key: 'projetos', label: 'Projetos', icon: '📁' },
  { key: 'metas', label: 'Metas', icon: '🎯' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {TABS.map((t) => {
          if (t.key === 'viper') {
            const on = active === 'viper';
            return (
              <TouchableOpacity key={t.key} style={styles.centerWrap} activeOpacity={0.85} onPress={() => onChange(t.key)}>
                <View style={[styles.center, on && styles.centerActive]}>
                  <Text style={styles.centerIcon}>{t.icon}</Text>
                </View>
              </TouchableOpacity>
            );
          }
          const on = active === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => onChange(t.key)}>
              <Text style={[styles.icon, on && styles.iconActive]}>{t.icon}</Text>
              <Text style={[styles.label, on && styles.labelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 28 : 18,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2 },
  icon: { fontSize: 19, opacity: 0.55 },
  iconActive: { opacity: 1 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  labelActive: { color: colors.textPrimary },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  centerActive: { backgroundColor: colors.neon },
  centerIcon: { fontSize: 24 },
});
