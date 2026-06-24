import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/Glass';
import { TOP_INSET, TAB_BAR_SPACE } from '../components/ScreenShell';
import { supabase } from '../lib/supabase';
import { getState } from '../backend/store';
import { PRIORITY_ICON, PRIORITY_LABEL, PRIORITY_ORDER, Priority } from '../backend/types';
import { colors } from '../theme/colors';

interface Row {
  id: string;
  title: string;
  priority: Priority;
  status: string;
}

export function TasksScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const userId = getState().session?.user.id;

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('tasks')
      .select('id,title,priority,status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setRows((data as Row[]) ?? []);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: Row) => {
    const next = row.status === 'done' ? 'pending' : 'done';
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', row.id);
  };

  const pending = rows
    .filter((r) => r.status !== 'done' && r.status !== 'cancelled')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const done = rows.filter((r) => r.status === 'done');

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.g}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
      >
        <Text style={styles.title}>Tarefas</Text>
        <Text style={styles.subtitle}>{pending.length} pendente{pending.length === 1 ? '' : 's'} • {done.length} concluída{done.length === 1 ? '' : 's'}</Text>

        {pending.length === 0 && done.length === 0 ? (
          <GlassCard style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma tarefa ainda. Peça à Viper para criar uma. 🐍</Text>
          </GlassCard>
        ) : null}

        {pending.map((r) => (
          <TouchableOpacity key={r.id} activeOpacity={0.8} onPress={() => void toggle(r)}>
            <GlassCard style={styles.card}>
              <View style={styles.checkbox} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardMeta}>{PRIORITY_ICON[r.priority]} {PRIORITY_LABEL[r.priority]}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {done.length > 0 && <Text style={styles.sectionLabel}>Concluídas</Text>}
        {done.map((r) => (
          <TouchableOpacity key={r.id} activeOpacity={0.8} onPress={() => void toggle(r)}>
            <GlassCard style={[styles.card, styles.cardDone]}>
              <View style={[styles.checkbox, styles.checkboxDone]}>
                <Text style={styles.check}>✓</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, styles.titleDone]}>{r.title}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  g: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: TOP_INSET + 18, paddingBottom: TAB_BAR_SPACE },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18 },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  empty: { padding: 22, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10 },
  cardDone: { opacity: 0.6 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  cardMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#04221C', fontSize: 14, fontWeight: '900' },
});
