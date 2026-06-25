import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/Glass';
import { TOP_INSET, TAB_BAR_SPACE } from '../components/ScreenShell';
import { supabase } from '../lib/supabase';
import { getState } from '../backend/store';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

interface Stats {
  pending: number;
  done: number;
  automations: number;
  messages: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countOf(table: string, userId: string, filter?: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export function MetricsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [stats, setStats] = useState<Stats>({ pending: 0, done: 0, automations: 0, messages: 0 });
  const userId = getState().session?.user.id;

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [pending, done, automations, messages] = await Promise.all([
        countOf('tasks', userId, (q) => q.eq('status', 'pending')),
        countOf('tasks', userId, (q) => q.eq('status', 'done')),
        countOf('automations', userId, (q) => q.eq('enabled', true)),
        countOf('messages', userId),
      ]);
      setStats({ pending, done, automations, messages });
    })();
  }, [userId]);

  const cards = [
    { label: 'Tarefas pendentes', value: stats.pending, icon: '📋', glow: stats.pending > 0 },
    { label: 'Concluídas', value: stats.done, icon: '✅', glow: false },
    { label: 'Automações ativas', value: stats.automations, icon: '⚙️', glow: false },
    { label: 'Mensagens com a Viper', value: stats.messages, icon: '💬', glow: false },
  ];

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.g}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Resumo</Text>
        <Text style={styles.subtitle}>Seu painel operacional</Text>

        <View style={styles.grid}>
          {cards.map((c) => (
            <GlassCard key={c.label} glow={c.glow} style={styles.stat}>
              <Text style={styles.statIcon}>{c.icon}</Text>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    g: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: TOP_INSET + 18, paddingBottom: TAB_BAR_SPACE },
    title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    stat: { width: '47%', padding: 18, minHeight: 120, justifyContent: 'center' },
    statIcon: { fontSize: 22, marginBottom: 8 },
    statValue: { color: colors.textPrimary, fontSize: 34, fontWeight: '800' },
    statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  });
