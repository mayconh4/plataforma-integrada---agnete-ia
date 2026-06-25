import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { AgentIntel, FlowNode } from '../store/types';
import { GlassView } from '../components/glass/GlassView';
import { GlassButton } from '../components/glass/GlassButton';
import { EditableIcon } from '../components/EditableIcon';
import { IconEditorModal } from '../components/IconEditorModal';
import { Stepper } from '../components/Stepper';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const FLOW_STATES: { k: FlowNode['state']; label: string }[] = [
  { k: 'done', label: 'Concluído' },
  { k: 'active', label: 'Em andamento' },
  { k: 'next', label: 'A seguir' },
];
type ListKey = 'strengths' | 'weaknesses' | 'improvements' | 'notWorthIt';

function Section({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GlassView radius={22} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {caption ? <Text style={[styles.sectionCaption, { color: theme.textMuted }]}>{caption}</Text> : null}
      <View style={{ marginTop: 14 }}>{children}</View>
    </GlassView>
  );
}

function MetricRow({ label, value, onChange, step, min, max, fmt }: { label: string; value: number; onChange: (v: number) => void; step: number; min: number; max: number; fmt?: (v: number) => string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Stepper value={value} onChange={onChange} step={step} min={min} max={max} fmt={fmt} />
    </View>
  );
}

/** Add / edit / delete a list of free-text items. */
function StringListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={styles.listRow}>
          <TextInput
            value={it}
            onChangeText={(t) => onChange(items.map((x, j) => (j === i ? t : x)))}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, styles.flex, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
          />
          <Pressable onPress={() => onChange(items.filter((_, j) => j !== i))} style={[styles.del, { borderColor: theme.glassBorder }]} hitSlop={6}>
            <Text style={[styles.delTxt, { color: theme.danger }]}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...items, ''])} style={[styles.addRow, { borderColor: theme.glassBorder }]}>
        <Text style={[styles.addTxt, { color: theme.primary }]}>＋ Adicionar</Text>
      </Pressable>
    </View>
  );
}

export function ProjetoEditScreen({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { theme } = useTheme();
  const { data, updateProject, updateProjectIntel, removeProject } = useStore();
  const insets = useSafeAreaInsets();
  const project = data.projects.find((p) => p.id === projectId);

  const [icon, setIcon] = useState(project?.icon ?? { emoji: '📁' });
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [intel, setIntel] = useState<AgentIntel>(() => JSON.parse(JSON.stringify(project?.intel ?? {})));
  const [iconOpen, setIconOpen] = useState(false);

  if (!project) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 60, alignItems: 'center' }]}>
        <Text style={{ color: theme.textMuted }}>Projeto não encontrado.</Text>
        <Pressable onPress={onClose} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const patch = (p: Partial<AgentIntel>) => setIntel((prev) => ({ ...prev, ...p }));

  // Editing intelligence/memory/expansion also keeps the brain graph consistent.
  const setMetric = (key: keyof AgentIntel, val: number) =>
    setIntel((prev) => {
      const next: AgentIntel = { ...prev, [key]: val };
      const regionId = key === 'intelligence' ? 'core' : key === 'memory' ? 'mem' : key === 'expansion' ? 'exp' : null;
      if (regionId) next.brain = prev.brain.map((r) => (r.id === regionId ? { ...r, level: val } : r));
      return next;
    });

  const save = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    updateProject(project.id, { name: name.trim() || project.name, description, icon });
    updateProjectIntel(project.id, intel);
    onClose();
  };

  const setList = (key: ListKey, items: string[]) => patch({ [key]: items } as Partial<AgentIntel>);

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={[styles.back, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]} hitSlop={8}>
            <Text style={[styles.backTxt, { color: theme.textSecondary }]}>Cancelar</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Editar projeto</Text>
          <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <Text style={[styles.saveTxt, { color: theme.textOnAccent }]}>Salvar</Text>
          </Pressable>
        </View>

        <Section title="Identidade" caption="Ícone, nome e descrição">
          <View style={styles.identityRow}>
            <EditableIcon icon={icon} size={64} round showEditBadge onPress={() => setIconOpen(true)} />
            <View style={styles.flex}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nome do projeto"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { marginTop: 8, color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
              />
            </View>
          </View>
        </Section>

        <Section title="Métricas dos agentes" caption="Números mostrados no painel">
          <MetricRow label="Agentes ativos" value={intel.activeAgents} onChange={(v) => patch({ activeAgents: v })} step={1} min={0} max={99} />
          <MetricRow label="Total de agentes" value={intel.totalAgents} onChange={(v) => patch({ totalAgents: v })} step={1} min={1} max={99} />
          <MetricRow label="Inteligência" value={intel.intelligence} onChange={(v) => setMetric('intelligence', v)} step={0.05} min={0} max={1} fmt={pct} />
          <MetricRow label="Memória" value={intel.memory} onChange={(v) => setMetric('memory', v)} step={0.05} min={0} max={1} fmt={pct} />
          <MetricRow label="Expansão" value={intel.expansion} onChange={(v) => setMetric('expansion', v)} step={0.05} min={0} max={1} fmt={pct} />
          <MetricRow label="Uptime" value={intel.uptime} onChange={(v) => patch({ uptime: v })} step={0.01} min={0} max={1} fmt={pct} />
          <MetricRow label="Ações / dia" value={intel.throughput} onChange={(v) => patch({ throughput: v })} step={50} min={0} max={100000} />
        </Section>

        <Section title="Skills atuando" caption="Habilidades e carga de cada uma">
          <View style={{ gap: 14 }}>
            {intel.skills.map((s) => (
              <View key={s.id} style={[styles.itemCard, { borderColor: theme.glassBorder }]}>
                <View style={styles.listRow}>
                  <TextInput
                    value={s.name}
                    onChangeText={(t) => patch({ skills: intel.skills.map((x) => (x.id === s.id ? { ...x, name: t } : x)) })}
                    placeholder="Nome da skill"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, styles.flex, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
                  />
                  <Pressable onPress={() => patch({ skills: intel.skills.filter((x) => x.id !== s.id) })} style={[styles.del, { borderColor: theme.glassBorder }]} hitSlop={6}>
                    <Text style={[styles.delTxt, { color: theme.danger }]}>✕</Text>
                  </Pressable>
                </View>
                <View style={[styles.metricRow, { marginTop: 10 }]}>
                  <View style={styles.activeRow}>
                    <Switch
                      value={s.active}
                      onValueChange={(v) => patch({ skills: intel.skills.map((x) => (x.id === s.id ? { ...x, active: v } : x)) })}
                      trackColor={{ false: theme.glassBorder, true: theme.primary }}
                      thumbColor="#fff"
                    />
                    <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{s.active ? 'Ativa' : 'Inativa'}</Text>
                  </View>
                  <Stepper value={s.load} onChange={(v) => patch({ skills: intel.skills.map((x) => (x.id === s.id ? { ...x, load: v } : x)) })} step={0.05} min={0} max={1} fmt={pct} />
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => patch({ skills: [...intel.skills, { id: `s_${Date.now()}`, name: 'Nova skill', load: 0.5, active: true }] })}
              style={[styles.addRow, { borderColor: theme.glassBorder }]}
            >
              <Text style={[styles.addTxt, { color: theme.primary }]}>＋ Adicionar skill</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Caminho do projeto" caption="Etapas: o que aconteceu e para onde vai">
          <View style={{ gap: 14 }}>
            {intel.flow.map((f) => (
              <View key={f.id} style={[styles.itemCard, { borderColor: theme.glassBorder }]}>
                <View style={styles.listRow}>
                  <TextInput
                    value={f.label}
                    onChangeText={(t) => patch({ flow: intel.flow.map((x) => (x.id === f.id ? { ...x, label: t } : x)) })}
                    placeholder="Etapa"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, styles.flex, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
                  />
                  <Pressable onPress={() => patch({ flow: intel.flow.filter((x) => x.id !== f.id) })} style={[styles.del, { borderColor: theme.glassBorder }]} hitSlop={6}>
                    <Text style={[styles.delTxt, { color: theme.danger }]}>✕</Text>
                  </Pressable>
                </View>
                <View style={styles.chipRow}>
                  {FLOW_STATES.map((st) => {
                    const sel = f.state === st.k;
                    return (
                      <Pressable
                        key={st.k}
                        onPress={() => patch({ flow: intel.flow.map((x) => (x.id === f.id ? { ...x, state: st.k } : x)) })}
                        style={[styles.chip, { borderColor: sel ? theme.primary : theme.glassBorder, backgroundColor: sel ? theme.primarySoft : 'transparent' }]}
                      >
                        <Text style={[styles.chipTxt, { color: sel ? theme.primary : theme.textSecondary }]}>{st.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => patch({ flow: [...intel.flow, { id: `f_${Date.now()}`, label: 'Nova etapa', state: 'next' }] })}
              style={[styles.addRow, { borderColor: theme.glassBorder }]}
            >
              <Text style={[styles.addTxt, { color: theme.primary }]}>＋ Adicionar etapa</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Cérebro do agente" caption="Regiões e níveis (núcleo, memória e expansão seguem as métricas)">
          <View style={{ gap: 10 }}>
            {intel.brain.map((b) => (
              <View key={b.id} style={styles.listRow}>
                <TextInput
                  value={b.label}
                  onChangeText={(t) => patch({ brain: intel.brain.map((x) => (x.id === b.id ? { ...x, label: t } : x)) })}
                  placeholder="Região"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, styles.flex, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
                />
                <Stepper value={b.level} onChange={(v) => patch({ brain: intel.brain.map((x) => (x.id === b.id ? { ...x, level: v } : x)) })} step={0.05} min={0} max={1} fmt={pct} />
                <Pressable onPress={() => patch({ brain: intel.brain.filter((x) => x.id !== b.id) })} style={[styles.del, { borderColor: theme.glassBorder }]} hitSlop={6}>
                  <Text style={[styles.delTxt, { color: theme.danger }]}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() =>
                patch({
                  brain: [
                    ...intel.brain,
                    { id: `b_${Date.now()}`, label: 'Nova região', level: 0.5, x: 0.2 + Math.min(0.6, intel.brain.length * 0.12), y: 0.55 },
                  ],
                })
              }
              style={[styles.addRow, { borderColor: theme.glassBorder }]}
            >
              <Text style={[styles.addTxt, { color: theme.primary }]}>＋ Adicionar região</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Diagnóstico" caption="Forças, fraquezas, melhorias e o que não vale a pena">
          <Text style={[styles.listTitle, { color: theme.success }]}>💪 Pontos fortes</Text>
          <StringListEditor items={intel.strengths} onChange={(v) => setList('strengths', v)} placeholder="Ponto forte" />
          <Text style={[styles.listTitle, { color: theme.danger, marginTop: 18 }]}>⚠️ Pontos fracos</Text>
          <StringListEditor items={intel.weaknesses} onChange={(v) => setList('weaknesses', v)} placeholder="Ponto fraco" />
          <Text style={[styles.listTitle, { color: theme.primary, marginTop: 18 }]}>🚀 O que melhorar</Text>
          <StringListEditor items={intel.improvements} onChange={(v) => setList('improvements', v)} placeholder="Melhoria" />
          <Text style={[styles.listTitle, { color: theme.textMuted, marginTop: 18 }]}>🛑 O que não vale a pena</Text>
          <StringListEditor items={intel.notWorthIt} onChange={(v) => setList('notWorthIt', v)} placeholder="Esforço de baixo valor" />
        </Section>

        <GlassButton label="Salvar alterações" variant="primary" onPress={save} style={{ marginTop: 4 }} />
        <Pressable
          onPress={() => {
            removeProject(project.id);
            onClose();
          }}
          style={styles.deleteProject}
        >
          <Text style={[styles.deleteTxt, { color: theme.danger }]}>Excluir projeto</Text>
        </Pressable>
      </ScrollView>

      <IconEditorModal
        visible={iconOpen}
        title="Ícone do projeto"
        initial={icon}
        onCancel={() => setIconOpen(false)}
        onSave={(ic) => {
          setIcon(ic);
          setIconOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10 },
  back: { paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backTxt: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800' },
  saveBtn: { paddingHorizontal: 18, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  saveTxt: { fontSize: 14, fontWeight: '700' },
  section: { padding: 18, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCaption: { fontSize: 12.5, marginTop: 2 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  metricLabel: { fontSize: 14, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemCard: { borderWidth: 1, borderRadius: 16, padding: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  del: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  delTxt: { fontSize: 15, fontWeight: '700' },
  addRow: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  addTxt: { fontSize: 13.5, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11, borderWidth: 1 },
  chipTxt: { fontSize: 12.5, fontWeight: '600' },
  listTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  deleteProject: { alignItems: 'center', paddingVertical: 18 },
  deleteTxt: { fontSize: 14, fontWeight: '700' },
});
