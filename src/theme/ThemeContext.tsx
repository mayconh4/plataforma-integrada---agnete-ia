import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, ThemeName, palettes } from './colors';

const STORAGE_KEY = '@viper/theme-mode';
export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  colors: Palette;
  /** preferência: dark | light | system */
  mode: ThemeMode;
  /** tema concreto em uso */
  name: ThemeName;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && (stored === 'dark' || stored === 'light' || stored === 'system')) {
          setModeState(stored);
        }
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const name: ThemeName = useMemo(() => {
    if (mode === 'system') return system === 'light' ? 'light' : 'dark';
    return mode;
  }, [mode, system]);

  const toggle = useCallback(() => setMode(name === 'dark' ? 'light' : 'dark'), [name, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: palettes[name], mode, name, setMode, toggle, ready }),
    [name, mode, setMode, toggle, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
