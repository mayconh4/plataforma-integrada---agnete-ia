import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, AppSettings, Goal, IconData, Project, Task } from './types';
import { SEED } from './seed';

const STORAGE_KEY = '@viper/app-data-v1';

type IconOwner = 'task' | 'goal' | 'project';

interface AppStoreValue {
  data: AppData;
  ready: boolean;

  // Tasks
  addTask: (t: Pick<Task, 'title'> & Partial<Task>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Goals
  addGoal: (g: Pick<Goal, 'title'> & Partial<Goal>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Projects
  addProject: (p: Pick<Project, 'name'> & Partial<Project>) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // Icons (works for any object)
  setIcon: (owner: IconOwner, id: string, icon: IconData) => void;

  // Settings & misc
  updateSettings: (patch: Partial<AppSettings>) => void;
  bumpMessageCount: (n?: number) => void;

  // Derived metrics
  metrics: {
    pendingTasks: number;
    completedTasks: number;
    activeAgents: number;
    totalAgents: number;
  };
}

const AppStoreContext = createContext<AppStoreValue | undefined>(undefined);

let idSeq = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${idSeq++}`;

const defaultIcon = (emoji: string): IconData => ({ emoji });

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(SEED);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from storage once.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as AppData;
            // Merge settings so newly-added setting keys keep sane defaults.
            setData({
              ...SEED,
              ...parsed,
              settings: { ...SEED.settings, ...parsed.settings },
            });
          } catch {
            /* keep seed on parse failure */
          }
        }
      })
      .finally(() => {
        if (active) {
          hydrated.current = true;
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const addTask = useCallback((t: Pick<Task, 'title'> & Partial<Task>) => {
    setData((d) => ({
      ...d,
      tasks: [
        ...d.tasks,
        {
          id: newId('task'),
          title: t.title,
          note: t.note,
          priority: t.priority ?? 'medium',
          done: t.done ?? false,
          icon: t.icon ?? defaultIcon('📋'),
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const addGoal = useCallback((g: Pick<Goal, 'title'> & Partial<Goal>) => {
    setData((d) => ({
      ...d,
      goals: [
        ...d.goals,
        {
          id: newId('goal'),
          title: g.title,
          note: g.note,
          priority: g.priority ?? 'medium',
          progress: g.progress ?? 0,
          icon: g.icon ?? defaultIcon('🎯'),
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const addProject = useCallback((p: Pick<Project, 'name'> & Partial<Project>) => {
    setData((d) => ({
      ...d,
      projects: [
        ...d.projects,
        {
          id: newId('proj'),
          name: p.name,
          description: p.description ?? '',
          icon: p.icon ?? defaultIcon('📁'),
          createdAt: Date.now(),
          intel:
            p.intel ?? {
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
              brain: [
                { id: 'core', label: 'Núcleo', level: 0.5, x: 0.5, y: 0.5 },
                { id: 'mem', label: 'Memória', level: 0.4, x: 0.28, y: 0.4 },
                { id: 'exp', label: 'Expansão', level: 0.4, x: 0.74, y: 0.4 },
              ],
              skills: [{ id: 's1', name: 'Geral', load: 0.5, active: true }],
              strengths: [],
              weaknesses: [],
              improvements: [],
              notWorthIt: [],
            },
        },
      ],
    }));
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
  }, []);

  const setIcon = useCallback((owner: IconOwner, id: string, icon: IconData) => {
    setData((d) => {
      if (owner === 'task')
        return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, icon } : t)) };
      if (owner === 'goal')
        return { ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, icon } : g)) };
      return { ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, icon } : p)) };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const bumpMessageCount = useCallback((n = 1) => {
    setData((d) => ({ ...d, messageCount: d.messageCount + n }));
  }, []);

  const metrics = useMemo(() => {
    const pendingTasks = data.tasks.filter((t) => !t.done).length;
    const completedTasks = data.tasks.filter((t) => t.done).length;
    const activeAgents = data.projects.reduce((s, p) => s + p.intel.activeAgents, 0);
    const totalAgents = data.projects.reduce((s, p) => s + p.intel.totalAgents, 0);
    return { pendingTasks, completedTasks, activeAgents, totalAgents };
  }, [data.tasks, data.projects]);

  const value = useMemo<AppStoreValue>(
    () => ({
      data,
      ready,
      addTask,
      updateTask,
      removeTask,
      toggleTask,
      addGoal,
      updateGoal,
      removeGoal,
      addProject,
      updateProject,
      removeProject,
      setIcon,
      updateSettings,
      bumpMessageCount,
      metrics,
    }),
    [
      data,
      ready,
      addTask,
      updateTask,
      removeTask,
      toggleTask,
      addGoal,
      updateGoal,
      removeGoal,
      addProject,
      updateProject,
      removeProject,
      setIcon,
      updateSettings,
      bumpMessageCount,
      metrics,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useStore must be used within an AppStoreProvider');
  return ctx;
}
