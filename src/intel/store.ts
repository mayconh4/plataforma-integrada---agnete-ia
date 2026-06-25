import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AgentIntel, IconData, ProjectMeta } from './types';

const STORAGE_KEY = '@viper/projects-intel-v1';

const brain = (i: number, m: number, e: number) => [
  { id: 'core', label: 'Núcleo', level: i, x: 0.5, y: 0.5 },
  { id: 'mem', label: 'Memória', level: m, x: 0.26, y: 0.38 },
  { id: 'exp', label: 'Expansão', level: e, x: 0.76, y: 0.36 },
  { id: 'lang', label: 'Linguagem', level: 0.7, x: 0.32, y: 0.72 },
  { id: 'plan', label: 'Planejamento', level: 0.64, x: 0.72, y: 0.7 },
  { id: 'percep', label: 'Percepção', level: 0.58, x: 0.5, y: 0.82 },
];

const SEED: ProjectMeta[] = [
  {
    id: 'airsoft',
    name: 'Perfection Airsoft',
    description: 'Loja e operação de airsoft',
    icon: { emoji: '🎯' },
    intel: {
      activeAgents: 4,
      totalAgents: 6,
      uptime: 0.98,
      throughput: 1860,
      intelligence: 0.86,
      memory: 0.72,
      expansion: 0.63,
      flow: [
        { id: 'f1', label: 'Catálogo importado', state: 'done' },
        { id: 'f2', label: 'CRM integrado', state: 'done' },
        { id: 'f3', label: 'Atendimento automático', state: 'active' },
        { id: 'f4', label: 'Campanhas de venda', state: 'next' },
        { id: 'f5', label: 'Previsão de estoque', state: 'next' },
      ],
      brain: brain(0.86, 0.72, 0.63),
      skills: [
        { id: 's1', name: 'Atendimento', load: 0.82, active: true },
        { id: 's2', name: 'Vendas', load: 0.64, active: true },
        { id: 's3', name: 'Estoque', load: 0.41, active: true },
        { id: 's4', name: 'Pós-venda', load: 0.2, active: false },
      ],
      strengths: ['Atendimento 24/7 consistente', 'Conhece todo o catálogo', 'Conversão alta no WhatsApp'],
      weaknesses: ['Previsão de estoque imprecisa', 'Pouca memória de clientes antigos'],
      improvements: ['Conectar nota fiscal', 'Treinar com histórico de compras'],
      notWorthIt: ['Posts manuais diários', 'Relatórios em PDF que ninguém lê'],
    },
  },
  {
    id: 'barber',
    name: 'App Barber',
    description: 'Agendamento para barbearias',
    icon: { emoji: '💈' },
    intel: {
      activeAgents: 2,
      totalAgents: 5,
      uptime: 0.94,
      throughput: 760,
      intelligence: 0.71,
      memory: 0.55,
      expansion: 0.48,
      flow: [
        { id: 'f1', label: 'Cadastro de barbeiros', state: 'done' },
        { id: 'f2', label: 'Agenda online', state: 'active' },
        { id: 'f3', label: 'Lembretes automáticos', state: 'next' },
        { id: 'f4', label: 'Pagamento no app', state: 'next' },
      ],
      brain: brain(0.71, 0.55, 0.48),
      skills: [
        { id: 's1', name: 'Agendamento', load: 0.78, active: true },
        { id: 's2', name: 'Lembretes', load: 0.36, active: true },
        { id: 's3', name: 'Fidelidade', load: 0.18, active: false },
      ],
      strengths: ['Agenda nunca dá choque de horário', 'Onboarding rápido de barbeiros'],
      weaknesses: ['Sem cobrança integrada', 'Notificações genéricas'],
      improvements: ['Integrar Pix', 'Mensagens personalizadas por cliente'],
      notWorthIt: ['Programa de pontos complexo'],
    },
  },
  {
    id: 'beleza',
    name: 'App Beleza',
    description: 'Plataforma de beleza',
    icon: { emoji: '💅' },
    intel: {
      activeAgents: 3,
      totalAgents: 7,
      uptime: 0.91,
      throughput: 540,
      intelligence: 0.68,
      memory: 0.49,
      expansion: 0.74,
      flow: [
        { id: 'f1', label: 'Marketplace inicial', state: 'done' },
        { id: 'f2', label: 'Perfis de profissionais', state: 'active' },
        { id: 'f3', label: 'Recomendação por IA', state: 'next' },
        { id: 'f4', label: 'Expansão regional', state: 'next' },
      ],
      brain: brain(0.68, 0.49, 0.74),
      skills: [
        { id: 's1', name: 'Descoberta', load: 0.7, active: true },
        { id: 's2', name: 'Recomendação', load: 0.52, active: true },
        { id: 's3', name: 'Marketing', load: 0.44, active: true },
        { id: 's4', name: 'Suporte', load: 0.12, active: false },
      ],
      strengths: ['Crescimento acelerado', 'Boa descoberta de profissionais'],
      weaknesses: ['Memória de preferências fraca', 'Uptime abaixo da meta'],
      improvements: ['Estabilizar infraestrutura', 'Memória de longo prazo por usuária'],
      notWorthIt: ['Anúncios pagos sem segmentação'],
    },
  },
];

// --- store singleton (mesmo padrão do backend/store) -----------------------

let projects: ProjectMeta[] = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects)).catch(() => {});
}

export function getProjects(): ProjectMeta[] {
  return projects;
}
export function getProject(id: string): ProjectMeta | undefined {
  return projects.find((p) => p.id === id);
}
export function subscribeIntel(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export async function hydrateIntel(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectMeta[];
      if (Array.isArray(parsed) && parsed.length) {
        projects = parsed;
        emit();
      }
    }
  } catch {
    /* mantém o seed */
  }
}

let seq = 0;
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${seq++}`;

export function addProject(name: string, description = ''): string {
  const id = newId('proj');
  projects = [
    ...projects,
    {
      id,
      name,
      description,
      icon: { emoji: '📁' },
      intel: {
        activeAgents: 1,
        totalAgents: 3,
        uptime: 0.9,
        throughput: 120,
        intelligence: 0.5,
        memory: 0.4,
        expansion: 0.4,
        flow: [
          { id: 'f1', label: 'Início', state: 'active' },
          { id: 'f2', label: 'Próximos passos', state: 'next' },
        ],
        brain: brain(0.5, 0.4, 0.4),
        skills: [{ id: 's1', name: 'Geral', load: 0.5, active: true }],
        strengths: [],
        weaknesses: [],
        improvements: [],
        notWorthIt: [],
      },
    },
  ];
  emit();
  persist();
  return id;
}

export function updateProjectMeta(id: string, patch: Partial<Pick<ProjectMeta, 'name' | 'description' | 'icon'>>): void {
  projects = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
  persist();
}

export function setProjectIcon(id: string, icon: IconData): void {
  updateProjectMeta(id, { icon });
}

export function updateIntel(id: string, intel: AgentIntel): void {
  projects = projects.map((p) => (p.id === id ? { ...p, intel } : p));
  emit();
  persist();
}

export function removeProject(id: string): void {
  projects = projects.filter((p) => p.id !== id);
  emit();
  persist();
}

/** Hook reativo para a lista de projetos. */
export function useProjects(): ProjectMeta[] {
  const [snap, setSnap] = useState<ProjectMeta[]>(projects);
  useEffect(() => {
    const unsub = subscribeIntel(() => setSnap([...projects]));
    void hydrateIntel();
    return unsub;
  }, []);
  return snap;
}
