import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { getProject, useProjects } from '../intel/store';
import { GlassCard } from '../components/Glass';
import { EditableIcon } from '../components/EditableIcon';
import { SpeakButton } from '../components/SpeakButton';
import { ProgressRing } from '../components/viz/ProgressRing';
import { BrainGraph } from '../components/viz/BrainGraph';
import { FlowPath } from '../components/viz/FlowPath';
import { SkillBars } from '../components/viz/SkillBars';
import { IntelList } from '../components/viz/IntelList';
import { TOP_INSET } from '../components/ScreenShell';

function Section({ title, caption, right, children }: { title: string; caption?: string; right?: React.ReactNode; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
          {caption ? <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>{caption}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </GlassCard>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.miniHead}>
        <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.miniVal, { color: colors.textPrimary }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={[styles.miniTrack, { backgroundColor: colors.vizGrid }]}>
        <View style={[styles.miniFill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProjectDetailScreen({ projectId, onBack, onEdit }: { projectId: string; onBack: () => void; onEdit: () => void }) {
  const { colors } = useTheme();
  useProjects(); // re-render on changes
  const { width } = useWindowDimensions();
  const project = getProject(projectId);

  if (!project) {
    return (
      <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.flex}>
        <View style={{ paddingTop: TOP_INSET + 60, alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Projeto não encontrado.</Text>
          <Pressable onPress={onBack} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Voltar</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const intel = project.intel;
  const brainWidth = Math.min(width - 80, 360);
  const summary =
    `Diagnóstico de ${project.name}. ${intel.activeAgents} de ${intel.totalAgents} agentes ativos. ` +
    `Inteligência ${Math.round(intel.intelligence * 100)} por cento, memória ${Math.round(intel.memory * 100)} por cento, ` +
    `expansão ${Math.round(intel.expansion * 100)} por cento. ` +
    (intel.strengths.length ? `Pontos fortes: ${intel.strengths.join(', ')}. ` : '') +
    (intel.improvements.length ? `O que melhorar: ${intel.improvements.join(', ')}.` : '');

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.flex}>
      <ScrollView contentContainerStyle={{ paddingTop: TOP_INSET + 10, paddingBottom: 40, paddingHorizontal: 18 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={[styles.back, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]} hitSlop={8}>
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
          </Pressable>
          <EditableIcon icon={project.icon} size={48} round />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{project.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: colors.online }]} />
              <Text style={[styles.status, { color: colors.textSecondary }]} numberOfLines={1}>{project.description}</Text>
            </View>
          </View>
          <Pressable onPress={onEdit} style={[styles.editBtn, { borderColor: colors.primary, backgroundColor: colors.primaryGlow }]} hitSlop={8}>
            <Text style={[styles.editTxt, { color: colors.primary }]}>✎ Editar</Text>
          </Pressable>
        </View>

        <Section title="Métricas dos agentes" caption="Visão geral em tempo real">
          <View style={styles.ringRow}>
            <ProgressRing value={intel.intelligence} label="Inteligência" color={colors.primary} />
            <ProgressRing value={intel.uptime} label="Uptime" color={colors.online} />
          </View>
          <View style={styles.tiles}>
            <View style={[styles.tile, { borderColor: colors.glassBorder }]}>
              <Text style={[styles.tileVal, { color: colors.accent }]}>{intel.activeAgents}/{intel.totalAgents}</Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>Agentes ativos</Text>
            </View>
            <View style={[styles.tile, { borderColor: colors.glassBorder }]}>
              <Text style={[styles.tileVal, { color: colors.textPrimary }]}>{intel.throughput.toLocaleString('pt-BR')}</Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>Ações / dia</Text>
            </View>
            <View style={[styles.tile, { borderColor: colors.glassBorder }]}>
              <Text style={[styles.tileVal, { color: colors.textPrimary }]}>{intel.skills.filter((s) => s.active).length}</Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>Skills ativas</Text>
            </View>
          </View>
        </Section>

        <Section title="Cérebro do agente" caption="Memória, expansão e inteligência" right={<SpeakButton id={`proj_${project.id}`} text={summary} size={32} />}>
          <View style={{ alignItems: 'center' }}>
            <BrainGraph regions={intel.brain} width={brainWidth} height={220} />
          </View>
          <View style={{ gap: 12, marginTop: 8 }}>
            <MiniBar label="Memória" value={intel.memory} color={colors.accent} />
            <MiniBar label="Expansão" value={intel.expansion} color={colors.primary} />
            <MiniBar label="Inteligência" value={intel.intelligence} color={colors.neon} />
          </View>
        </Section>

        <Section title="Caminho do projeto" caption="O que está acontecendo e para onde está indo">
          <FlowPath nodes={intel.flow} />
        </Section>

        <Section title="Skills atuando" caption="Quais habilidades o agente está executando">
          <SkillBars skills={intel.skills} />
        </Section>

        <Section title="Diagnóstico" caption="Forças, fraquezas e prioridades">
          <View style={{ gap: 18 }}>
            <IntelList title="Pontos fortes" icon="💪" color={colors.online} items={intel.strengths} />
            <IntelList title="Pontos fracos" icon="⚠️" color={colors.danger} items={intel.weaknesses} />
            <IntelList title="O que melhorar" icon="🚀" color={colors.primary} items={intel.improvements} />
            <IntelList title="O que não vale a pena" icon="🛑" color={colors.textMuted} items={intel.notWorthIt} />
          </View>
        </Section>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backIcon: { fontSize: 28, fontWeight: '500', marginTop: -4 },
  name: { fontSize: 21, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 13, flex: 1 },
  editBtn: { paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editTxt: { fontSize: 13, fontWeight: '700' },
  section: { padding: 18, marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCaption: { fontSize: 12.5, marginTop: 2 },
  ringRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  tileVal: { fontSize: 20, fontWeight: '800' },
  tileLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  miniHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  miniLabel: { fontSize: 13, fontWeight: '600' },
  miniVal: { fontSize: 13, fontWeight: '700' },
  miniTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4 },
});
