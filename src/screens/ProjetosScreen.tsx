import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { Project, IconData } from '../store/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { GlassView } from '../components/glass/GlassView';
import { EditableIcon } from '../components/EditableIcon';
import { IconEditorModal } from '../components/IconEditorModal';
import { RecordEditModal, RecordDraft } from '../components/RecordEditModal';

export function ProjetosScreen({ onOpen }: { onOpen: (projectId: string) => void }) {
  const { theme } = useTheme();
  const { data, addProject, updateProject, removeProject, setIcon } = useStore();
  const projects = data.projects;

  const [editing, setEditing] = useState<Project | 'new' | null>(null);
  const [iconProj, setIconProj] = useState<Project | null>(null);

  const draft: RecordDraft =
    editing && editing !== 'new'
      ? { title: editing.name, note: editing.description }
      : { title: '', note: '' };

  const onSave = (d: RecordDraft) => {
    if (editing === 'new') addProject({ name: d.title, description: d.note });
    else if (editing) updateProject(editing.id, { name: d.title, description: d.note });
    setEditing(null);
  };

  return (
    <>
      <ScreenContainer
        title="Projetos"
        subtitle="Toque para abrir o painel do projeto"
        onAdd={() => setEditing('new')}
      >
        <View style={{ gap: 14 }}>
          {projects.map((p) => (
            <GlassView key={p.id} radius={22} style={styles.card}>
              <Pressable style={styles.row} onPress={() => onOpen(p.id)}>
                <EditableIcon
                  icon={p.icon}
                  size={54}
                  round
                  showEditBadge
                  onPress={() => setIconProj(p)}
                />
                <View style={styles.body}>
                  <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={1}>
                    {p.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.dot, { backgroundColor: theme.online }]} />
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {p.intel.activeAgents} de {p.intel.totalAgents} agentes ativos
                    </Text>
                  </View>
                </View>
                <Text style={[styles.chev, { color: theme.textMuted }]}>›</Text>
              </Pressable>
            </GlassView>
          ))}
        </View>
      </ScreenContainer>

      <RecordEditModal
        visible={editing !== null}
        heading={editing === 'new' ? 'Novo projeto' : 'Editar projeto'}
        titleLabel="Nome"
        noteLabel="Descrição"
        initial={draft}
        canDelete={editing !== 'new'}
        onSave={onSave}
        onCancel={() => setEditing(null)}
        onDelete={() => {
          if (editing && editing !== 'new') removeProject(editing.id);
          setEditing(null);
        }}
      />

      <IconEditorModal
        visible={iconProj !== null}
        title="Ícone do projeto"
        initial={iconProj?.icon ?? { emoji: '📁' }}
        onCancel={() => setIconProj(null)}
        onSave={(icon: IconData) => {
          if (iconProj) setIcon('project', iconProj.id, icon);
          setIconProj(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  body: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800' },
  desc: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  meta: { fontSize: 12, fontWeight: '600' },
  chev: { fontSize: 30, fontWeight: '300' },
});
