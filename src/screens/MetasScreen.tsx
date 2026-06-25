import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { Goal, IconData } from '../store/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { GlassView } from '../components/glass/GlassView';
import { EditableIcon } from '../components/EditableIcon';
import { IconEditorModal } from '../components/IconEditorModal';
import { PriorityBadge } from '../components/PriorityBadge';
import { SpeakButton } from '../components/SpeakButton';
import { RecordEditModal, RecordDraft } from '../components/RecordEditModal';

export function MetasScreen() {
  const { theme } = useTheme();
  const { data, addGoal, updateGoal, removeGoal, setIcon } = useStore();
  const goals = data.goals;

  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const [iconGoal, setIconGoal] = useState<Goal | null>(null);

  const draft: RecordDraft =
    editing && editing !== 'new'
      ? { title: editing.title, note: editing.note ?? '', priority: editing.priority, progress: editing.progress }
      : { title: '', note: '', priority: 'medium', progress: 0 };

  const onSave = (d: RecordDraft) => {
    if (editing === 'new') addGoal({ title: d.title, note: d.note, priority: d.priority, progress: d.progress });
    else if (editing) updateGoal(editing.id, { title: d.title, note: d.note, priority: d.priority, progress: d.progress });
    setEditing(null);
  };

  return (
    <>
      <ScreenContainer title="Metas" subtitle="Seus objetivos prioritários" onAdd={() => setEditing('new')}>
        <View style={{ gap: 12 }}>
          {goals.length === 0 && (
            <Text style={[styles.empty, { color: theme.textMuted }]}>Nenhuma meta ainda. Toque em ＋ para criar.</Text>
          )}
          {goals.map((g) => (
            <GlassView key={g.id} radius={20} style={styles.card}>
              <View style={styles.row}>
                <EditableIcon icon={g.icon} size={44} showEditBadge onPress={() => setIconGoal(g)} />
                <Pressable style={styles.body} onPress={() => setEditing(g)}>
                  <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
                    {g.title}
                  </Text>
                  <PriorityBadge priority={g.priority} prefix="Prioridade" />
                </Pressable>
                <SpeakButton id={`goal_${g.id}`} text={`${g.title}. ${g.note ?? ''}`} size={30} accent />
              </View>

              <View style={[styles.track, { backgroundColor: theme.vizGrid }]}>
                <View style={[styles.fill, { width: `${Math.round(g.progress * 100)}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text style={[styles.pct, { color: theme.textMuted }]}>{Math.round(g.progress * 100)}% concluído</Text>
            </GlassView>
          ))}
        </View>
      </ScreenContainer>

      <RecordEditModal
        visible={editing !== null}
        heading={editing === 'new' ? 'Nova meta' : 'Editar meta'}
        titleLabel="Título"
        noteLabel="Descrição"
        initial={draft}
        showPriority
        showProgress
        canDelete={editing !== 'new'}
        onSave={onSave}
        onCancel={() => setEditing(null)}
        onDelete={() => {
          if (editing && editing !== 'new') removeGoal(editing.id);
          setEditing(null);
        }}
      />

      <IconEditorModal
        visible={iconGoal !== null}
        title="Ícone da meta"
        initial={iconGoal?.icon ?? { emoji: '🎯' }}
        onCancel={() => setIconGoal(null)}
        onSave={(icon: IconData) => {
          if (iconGoal) setIcon('goal', iconGoal.id, icon);
          setIconGoal(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  pct: { fontSize: 12, fontWeight: '600' },
});
