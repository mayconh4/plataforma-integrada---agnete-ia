import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/Glass';
import { TOP_INSET, TAB_BAR_SPACE } from '../components/ScreenShell';
import { supabase } from '../lib/supabase';
import { getState } from '../backend/store';
import { PRIORITY_LABEL, Priority } from '../backend/types';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

interface Row {
  id: string;
  title: string;
  priority: Priority;
  status: string;
}

export function GoalsScreen({ onAskViper }: { onAskViper: (text: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [rows, setRows] = useState<Row[]>([]);
  const userId = getState().session?.user.id;

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id,title,priority,status')
        .eq('user_id', userId)
        .in('priority', ['urgent', 'high'])
        .neq('status', 'done')
        .order('priority', { ascending: true });
      setRows((data as Row[]) ?? []);
    })();
  }, [userId]);

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.g}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Metas</Text>
        <Text style={styles.subtitle}>Seus objetivos prioritários</Text>

        {rows.length === 0 ? (
          <GlassCard style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma meta prioritária no momento.</Text>
            <Text style={styles.emptyHint} onPress={() => onAskViper('Quais devem ser minhas metas para esta semana?')}>
              Toque para pedir sugestões à Viper →
            </Text>
          </GlassCard>
        ) : (
          rows.map((r) => (
            <GlassCard key={r.id} glow={r.priority === 'urgent'} style={styles.card}>
              <View style={[styles.dot, { backgroundColor: r.priority === 'urgent' ? colors.priorityUrgent : colors.priorityHigh }]} />
              <View style={styles.body}>
                <Text style={styles.name}>{r.title}</Text>
                <Text style={styles.meta}>Prioridade {PRIORITY_LABEL[r.priority]}</Text>
              </View>
            </GlassCard>
          ))
        )}
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
    empty: { padding: 22, alignItems: 'center', gap: 10 },
    emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
    emptyHint: { color: colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 12 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    body: { flex: 1 },
    name: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
    meta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  });
