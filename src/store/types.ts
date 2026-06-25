/** Domain model for the Viper platform. Everything here is user-editable and persisted. */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * A visual icon for any object. Either an emoji glyph or an uploaded image with a
 * stored pan/zoom transform so it renders identically wherever it appears.
 */
export interface IconData {
  /** Emoji used when no image is set (always present as a fallback). */
  emoji: string;
  /** Optional local/remote image uri uploaded by the user. */
  imageUri?: string;
  /** Pan/zoom adjustments captured in the icon editor. */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  /** Optional tint behind transparent emojis. */
  bg?: string;
}

export interface Task {
  id: string;
  title: string;
  note?: string;
  priority: Priority;
  done: boolean;
  icon: IconData;
  createdAt: number;
}

export interface Goal {
  id: string;
  title: string;
  note?: string;
  priority: Priority;
  progress: number; // 0..1
  icon: IconData;
  createdAt: number;
}

/** A skill an agent can run inside a project. */
export interface Skill {
  id: string;
  name: string;
  /** 0..1 — how heavily this skill is currently engaged. */
  load: number;
  active: boolean;
}

/** A node in the project's "what's happening / where it's going" flow path. */
export interface FlowNode {
  id: string;
  label: string;
  /** done = behind us, active = current, next = upcoming. */
  state: 'done' | 'active' | 'next';
}

/** A region of the agent "brain" graph. */
export interface BrainRegion {
  id: string;
  label: string;
  /** 0..1 strength / activation used for sizing + glow. */
  level: number;
  /** normalized position inside the brain canvas (0..1). */
  x: number;
  y: number;
}

export interface AgentIntel {
  /** Active autonomous agents working the project. */
  activeAgents: number;
  totalAgents: number;
  /** 0..1 measured health/uptime. */
  uptime: number;
  /** Tokens / actions in the last window (for the activity metric). */
  throughput: number;
  /** 0..1 overall intelligence index. */
  intelligence: number;
  /** 0..1 memory utilisation. */
  memory: number;
  /** 0..1 expansion / growth rate. */
  expansion: number;
  /** Trajectory: where the project has been and is heading. */
  flow: FlowNode[];
  brain: BrainRegion[];
  skills: Skill[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  /** "O que não está valendo a pena" — low-value efforts to drop. */
  notWorthIt: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: IconData;
  intel: AgentIntel;
  createdAt: number;
}

export interface AppSettings {
  voiceEnabled: boolean;
  /** Speech rate 0.5..1.6. */
  voiceRate: number;
  /** Speech pitch 0.7..1.4. */
  voicePitch: number;
  /** Keep working with screen off (keep-awake + background audio session). */
  alwaysOn: boolean;
  /** Auto-narrate new agent replies. */
  autoNarrate: boolean;
  userName: string;
}

export interface AppData {
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  settings: AppSettings;
  /** Lifetime message counter for the dashboard. */
  messageCount: number;
}
