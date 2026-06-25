/** Modelo local (persistido) dos projetos e da inteligência dos agentes. */

export interface IconData {
  emoji: string;
  imageUri?: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  bg?: string;
}

export interface Skill {
  id: string;
  name: string;
  load: number; // 0..1
  active: boolean;
}

export interface FlowNode {
  id: string;
  label: string;
  state: 'done' | 'active' | 'next';
}

export interface BrainRegion {
  id: string;
  label: string;
  level: number; // 0..1
  x: number; // 0..1
  y: number; // 0..1
}

export interface AgentIntel {
  activeAgents: number;
  totalAgents: number;
  uptime: number; // 0..1
  throughput: number;
  intelligence: number; // 0..1
  memory: number; // 0..1
  expansion: number; // 0..1
  flow: FlowNode[];
  brain: BrainRegion[];
  skills: Skill[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  notWorthIt: string[];
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  icon: IconData;
  intel: AgentIntel;
}
