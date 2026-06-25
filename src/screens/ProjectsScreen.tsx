import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/Glass';
import { TOP_INSET, TAB_BAR_SPACE } from '../components/ScreenShell';
import { useTheme } from '../theme/ThemeContext';
import { useProjects, addProject, setProjectIcon } from '../intel/store';
import { IconData, ProjectMeta } from '../intel/types';
import { EditableIcon } from '../components/EditableIcon';
import { IconEditorModal } from '../components/IconEditorModal';

interface Props {
  /** abre o painel de inteligência do projeto */
  onOpen: (projectId: string) => void;
  /** abre o editor completo do projeto */
  onEditProject: (projectId: string) => void;
}

export function ProjectsScreen({ onOpen, onEditProject }: Props) {
  const { colors } = useTheme();
  const projects = useProjects();
  const [iconTarget, setIconTarget] = useState<ProjectMeta | null>(null);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.g}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Projetos</Text>
              <Text style={styles.subtitle}>Toque para abrir o painel de inteligência</Text>
            </View>
            <Pressable onPress={() => onEditProject(addProject('Novo projeto'))} style={styles.add} hitSlop={8}>
              <Text style={styles.addIcon}>＋</Text>
            </Pressable>
          </View>

          {projects.map((p) => (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => onOpen(p.id)}>
              <GlassCard style={styles.card}>
                <EditableIcon icon={p.icon} size={54} round showEditBadge onPress={() => setIconTarget(p)} />
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.desc} numberOfLines={1}>{p.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.dot} />
                    <Text style={styles.meta}>{p.intel.activeAgents} de {p.intel.totalAgents} agentes ativos</Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <IconEditorModal
        visible={iconTarget !== null}
        title="Ícone do projeto"
        initial={iconTarget?.icon ?? { emoji: '📁' }}
        onCancel={() => setIconTarget(null)}
        onSave={(icon: IconData) => {
          if (iconTarget) setProjectIcon(iconTarget.id, icon);
          setIconTarget(null);
        }}
      />
    </>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    g: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: TOP_INSET + 18, paddingBottom: TAB_BAR_SPACE },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
    title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
    add: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    addIcon: { color: colors.primary, fontSize: 24, fontWeight: '600', marginTop: -2 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 12 },
    body: { flex: 1 },
    name: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
    desc: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.online },
    meta: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    arrow: { color: colors.textSecondary, fontSize: 28, fontWeight: '300' },
  });
