/**
 * Paleta de cores com dois temas: escuro (vidro profundo) e claro (inspirado no
 * Claude — papel quente + coral, em vidro translúcido). Ambos implementam a
 * mesma interface `Palette`; o `ThemeContext` entrega o ativo via `useTheme()`.
 *
 * `colors` continua exportado (= tema escuro) só como fallback de compatibilidade.
 * Em componentes, prefira `const { colors } = useTheme()`.
 */

export type BlurTint = 'light' | 'dark' | 'default';

export interface Palette {
  // Vidro
  glassBg: string;
  glassBgStrong: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;
  blurTint: BlurTint;

  // Marca / acentos
  primary: string;
  primaryGlow: string;
  accent: string;
  accentGlow: string;
  neon: string;
  danger: string;
  warning: string;
  online: string;

  // Fundo
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  surface: string;
  surfaceSoft: string;

  // Texto
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  // Bolhas de chat
  hermesBubble: string;
  userBubble: string;
  viperBubble: string;

  // Prioridades
  priorityUrgent: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;

  // Data-viz (cérebro / caminho)
  vizNode: string;
  vizNodeCore: string;
  vizLink: string;
  vizGrid: string;
}

export const darkColors: Palette = {
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBgStrong: 'rgba(255, 255, 255, 0.14)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  glassHighlight: 'rgba(255, 255, 255, 0.4)',
  glassShadow: 'rgba(0, 0, 0, 0.15)',
  blurTint: 'dark',

  primary: '#7C7BFF',
  primaryGlow: 'rgba(124, 123, 255, 0.35)',
  accent: '#27E0C0',
  accentGlow: 'rgba(39, 224, 192, 0.30)',
  neon: '#8B5CFF',
  danger: '#FF5C72',
  warning: '#F5A623',
  online: '#3FE0A2',

  background: '#070712',
  backgroundGradientStart: '#070712',
  backgroundGradientEnd: '#15173A',
  surface: '#10122A',
  surfaceSoft: 'rgba(255,255,255,0.05)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textMuted: 'rgba(255, 255, 255, 0.42)',
  textOnAccent: '#FFFFFF',

  hermesBubble: 'rgba(124, 123, 255, 0.15)',
  userBubble: 'rgba(39, 224, 192, 0.15)',
  viperBubble: 'rgba(124, 123, 255, 0.15)',

  priorityUrgent: '#FF5C72',
  priorityHigh: '#FF9F43',
  priorityMedium: '#FFC542',
  priorityLow: '#27E0C0',

  vizNode: 'rgba(124, 123, 255, 0.85)',
  vizNodeCore: '#B9B8FF',
  vizLink: 'rgba(124, 123, 255, 0.35)',
  vizGrid: 'rgba(255, 255, 255, 0.07)',
};

/** Tema claro — paleta quente estilo Claude renderizada como vidro suave. */
export const lightColors: Palette = {
  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBgStrong: 'rgba(255, 255, 255, 0.74)',
  glassBorder: 'rgba(60, 50, 40, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 0.85)',
  glassShadow: 'rgba(70, 55, 40, 0.16)',
  blurTint: 'light',

  primary: '#C96442',
  primaryGlow: 'rgba(201, 100, 66, 0.20)',
  accent: '#1F8A70',
  accentGlow: 'rgba(31, 138, 112, 0.16)',
  neon: '#C96442',
  danger: '#D9534F',
  warning: '#C77D11',
  online: '#1F8A70',

  background: '#F5F3EC',
  backgroundGradientStart: '#FAF9F5',
  backgroundGradientEnd: '#ECE7DC',
  surface: '#FBFAF6',
  surfaceSoft: 'rgba(40, 34, 30, 0.04)',

  textPrimary: '#262220',
  textSecondary: 'rgba(38, 34, 32, 0.66)',
  textMuted: 'rgba(38, 34, 32, 0.42)',
  textOnAccent: '#FFFFFF',

  hermesBubble: 'rgba(201, 100, 66, 0.10)',
  userBubble: 'rgba(31, 138, 112, 0.10)',
  viperBubble: 'rgba(201, 100, 66, 0.10)',

  priorityUrgent: '#D9534F',
  priorityHigh: '#D9822B',
  priorityMedium: '#C9A227',
  priorityLow: '#1F8A70',

  vizNode: 'rgba(201, 100, 66, 0.85)',
  vizNodeCore: '#C96442',
  vizLink: 'rgba(201, 100, 66, 0.30)',
  vizGrid: 'rgba(38, 34, 32, 0.08)',
};

export type ThemeName = 'dark' | 'light';
export const palettes: Record<ThemeName, Palette> = { dark: darkColors, light: lightColors };

/** @deprecated use `useTheme().colors` — mantido só como fallback (tema escuro). */
export const colors = darkColors;
