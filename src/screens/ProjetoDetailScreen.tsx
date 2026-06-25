import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { GlassView } from '../components/glass/GlassView';
import { EditableIcon } from '../components/EditableIcon';
import { SpeakButton } from '../components/SpeakButton';
import { ProgressRing } from '../components/viz/ProgressRing';
import { BrainGraph } from '../components/viz/BrainGraph';
import { FlowPath } from '../components/viz/FlowPath';
import { SkillBars } from '../components/viz/SkillBars';
import { IntelList } from '../components/viz/IntelList';

function Section({ title, caption, right, children }: { title: string; caption?: string; right?: React.ReactNode; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GlassView radius={22} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
          {caption ? <Text style={[styles.sectionCaption, { color: theme.textMuted }]}>{caption}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </GlassView>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.miniBar}>
      <View style={styles.miniBarHead}>
        <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.miniVal, { color: theme.textPrimary }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={[styles.miniTrack, { backgroundColor: theme.vizGrid }]}>
        <View style={[styles.miniFill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProjetoDetailScreen({ projectId, onBack, onEdit }: { projectId: string; onBack: () => void; onEdit: () => void }) {
  const { theme } = useTheme();
  const { data } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const project = data.projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 60, alignItems: 'center' }]}>
        <Text style={{ color: theme.textMuted }}>Projeto não encontrado.</Text>
        <Pressable onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const intel = project.intel;
  const brainWidth = Math.min(width - 72, 360);

  const summary =
    `Diagnóstico de ${project.name}. ${intel.activeAgents} de ${intel.totalAgents} agentes ativos. ` +
    `Inteligência ${Math.round(intel.intelligence * 100)} por cento, memória ${Math.round(intel.memory * 100)} por cento, ` +
    `expansão ${Math.round(intel.expansion * 100)} por cento. ` +
    (intel.strengths.length ? `Pontos fortes: ${intel.strengths.join(', ')}. ` : '') +
    (intel.improvements.length ? `O que melhorar: ${intel.improvements.join(', ')}.` : '');

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={[styles.back, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]} hitSlop={8}>
            <Text style={[styles.backIcon, { color: theme.textPrimary }]}>‹</Text>
          </Pressable>
          <EditableIcon icon={project.icon} size={48} round />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{project.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: theme.online }]} />
              <Text style={[styles.status, { color: theme.textSecondary }]}>{project.description}</Text>
            </View>
          </View>
          <Pressable onPress={onEdit} style={[styles.editBtn, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]} hitSlop={8}>
            <Text style={[styles.editTxt, { color: theme.primary }]}>✎ Editar</Text>
          </Pressable>
        </View>

        {/* Key metrics */}
        <Section title="Métricas dos agentes" caption="Visão geral em tempo real">
          <View style={styles.ringRow}>
            <ProgressRing value={intel.intelligence} label="Inteligência" color={theme.primary} />
            <ProgressRing value={intel.uptime} label="Uptime" color={theme.online} />
          </View>
          <View style={styles.statTiles}>
            <View style={[styles.tile, { borderColor: theme.glassBorder }]}>
              <Text style={[styles.tileVal, { color: theme.accent }]}>{intel.activeAgents}/{intel.totalAgents}</Text>
              <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Agentes ativos</Text>
            </View>
            <View style={[styles.tile, { borderColor: theme.glassBorder }]}>
              <Text style={[styles.tileVal, { color: theme.textPrimary }]}>{intel.throughput.toLocaleString('pt-BR')}</Text>
              <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Ações / dia</Text>
            </View>
            <View style={[styles.tile, { borderColor: theme.glassBorder }]}>
              <Text style={[styles.tileVal, { color: theme.textPrimary }]}>{intel.skills.filter((s) => s.active).length}</Text>
              <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Skills ativas</Text>
            </View>
          </View>
        </Section>

        {/* Brain */}
        <Section
          title="Cérebro do agente"
          caption="Memória, expansão e inteligência"
          right={<SpeakButton id={`proj_${project.id}`} text={summary} size={32} />}
        >
          <View style={{ alignItems: 'center' }}>
            <BrainGraph regions={intel.brain} width={brainWidth} height={220} />
          </View>
          <View style={{ gap: 12, marginTop: 8 }}>
            <MiniBar label="Memória" value={intel.memory} color={theme.accent} />
            <MiniBar label="Expansão" value={intel.expansion} color={theme.primary} />
            <MiniBar label="Inteligência" value={intel.intelligence} color={theme.info} />
          </View>
        </Section>

        {/* Flow / trajectory */}
        <Section title="Caminho do projeto" caption="O que está acontecendo e para onde está indo">
          <FlowPath nodes={intel.flow} />
        </Section>

        {/* Skills */}
        <Section title="Skills atuando" caption="Quais habilidades o agente está executando">
          <SkillBars skills={intel.skills} />
        </Section>

        {/* SWOT */}
        <Section title="Diagnóstico" caption="Forças, fraquezas e prioridades">
          <View style={{ gap: 18 }}>
            <IntelList title="Pontos fortes" icon="💪" color={theme.success} items={intel.strengths} />
            <IntelList title="Pontos fracos" icon="⚠️" color={theme.danger} items={intel.weaknesses} />
            <IntelList title="O que melhorar" icon="🚀" color={theme.primary} items={intel.improvements} />
            <IntelList title="O que não vale a pena" icon="🛑" color={theme.textMuted} items={intel.notWorthIt} />
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backIcon: { fontSize: 28, fontWeight: '500', marginTop: -4 },
  name: { fontSize: 22, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 13, flex: 1 },
  editBtn: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editTxt: { fontSize: 13, fontWeight: '700' },
  section: { padding: 18, marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCaption: { fontSize: 12.5, marginTop: 2 },
  ringRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  statTiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  tileVal: { fontSize: 20, fontWeight: '800' },
  tileLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  miniBar: {},
  miniBarHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  miniLabel: { fontSize: 13, fontWeight: '600' },
  miniVal: { fontSize: 13, fontWeight: '700' },
  miniTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4 },
});
