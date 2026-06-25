import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { Task, IconData } from '../store/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { GlassView } from '../components/glass/GlassView';
import { EditableIcon } from '../components/EditableIcon';
import { IconEditorModal } from '../components/IconEditorModal';
import { PriorityBadge } from '../components/PriorityBadge';
import { SpeakButton } from '../components/SpeakButton';
import { RecordEditModal, RecordDraft } from '../components/RecordEditModal';

export function TarefasScreen() {
  const { theme } = useTheme();
  const { data, addTask, updateTask, removeTask, toggleTask, setIcon } = useStore();
  const tasks = data.tasks;
  const pending = tasks.filter((t) => !t.done).length;
  const done = tasks.filter((t) => t.done).length;

  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [iconTask, setIconTask] = useState<Task | null>(null);

  const draft: RecordDraft =
    editing && editing !== 'new'
      ? { title: editing.title, note: editing.note ?? '', priority: editing.priority }
      : { title: '', note: '', priority: 'medium' };

  const onSave = (d: RecordDraft) => {
    if (editing === 'new') addTask({ title: d.title, note: d.note, priority: d.priority });
    else if (editing) updateTask(editing.id, { title: d.title, note: d.note, priority: d.priority });
    setEditing(null);
  };

  return (
    <>
      <ScreenContainer
        title="Tarefas"
        subtitle={`${pending} pendentes · ${done} concluídas`}
        onAdd={() => setEditing('new')}
      >
        <View style={{ gap: 12 }}>
          {tasks.length === 0 && (
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              Nenhuma tarefa ainda. Toque em ＋ para criar.
            </Text>
          )}
          {tasks.map((t) => (
            <GlassView key={t.id} radius={20} style={styles.card}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  toggleTask(t.id);
                }}
                style={[
                  styles.check,
                  { borderColor: t.done ? theme.success : theme.glassBorder, backgroundColor: t.done ? theme.success : 'transparent' },
                ]}
                hitSlop={8}
              >
                {t.done && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>

              <EditableIcon icon={t.icon} size={44} showEditBadge onPress={() => setIconTask(t)} />

              <Pressable style={styles.body} onPress={() => setEditing(t)}>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary },
                    t.done && { textDecorationLine: 'line-through', color: theme.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {t.title}
                </Text>
                <View style={styles.meta}>
                  <PriorityBadge priority={t.priority} />
                </View>
              </Pressable>

              <SpeakButton id={`task_${t.id}`} text={`${t.title}. ${t.note ?? ''}`} size={30} />
            </GlassView>
          ))}
        </View>
      </ScreenContainer>

      <RecordEditModal
        visible={editing !== null}
        heading={editing === 'new' ? 'Nova tarefa' : 'Editar tarefa'}
        titleLabel="Título"
        noteLabel="Observação"
        initial={draft}
        showPriority
        canDelete={editing !== 'new'}
        onSave={onSave}
        onCancel={() => setEditing(null)}
        onDelete={() => {
          if (editing && editing !== 'new') removeTask(editing.id);
          setEditing(null);
        }}
      />

      <IconEditorModal
        visible={iconTask !== null}
        title="Ícone da tarefa"
        initial={iconTask?.icon ?? { emoji: '📋' }}
        onCancel={() => setIconTask(null)}
        onSave={(icon: IconData) => {
          if (iconTask) setIcon('task', iconTask.id, icon);
          setIconTask(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { marginTop: 5 },
});
