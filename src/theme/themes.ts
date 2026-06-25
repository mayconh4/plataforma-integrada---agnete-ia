/**
 * Theme tokens shared by the dark and light (Claude-inspired liquid glass) themes.
 * Every screen and component consumes these via `useTheme()` so a single switch
 * re-skins the whole app. Keep both theme objects in lock-step with this type.
 */

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeName = 'dark' | 'light';
export type BlurTint = 'light' | 'dark' | 'default';

export interface Theme {
  name: ThemeName;
  /** Background gradient, top -> bottom. */
  bgGradient: [string, string, ...string[]];
  /** Solid fallback background. */
  bg: string;
  /** Tint passed to expo-blur surfaces. */
  blurTint: BlurTint;
  /** Blur intensity for primary glass surfaces. */
  blurIntensity: number;

  // Glass surfaces (translucent "liquid glass")
  glass: string;
  glassStrong: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  // Brand / accents
  primary: string;
  primarySoft: string;
  primaryGlow: string;
  accent: string;
  accentSoft: string;

  // Status / semantics
  online: string;
  danger: string;
  warning: string;
  success: string;
  info: string;

  // Priority palette (tasks / goals)
  priorityUrgent: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;

  // Chat bubbles
  bubbleAgent: string;
  bubbleAgentBorder: string;
  bubbleUser: string;
  bubbleUserBorder: string;

  // Data-viz (brain / flow diagrams)
  vizNode: string;
  vizNodeCore: string;
  vizLink: string;
  vizGrid: string;
}

/** Dark theme — deep translucent navy "liquid glass". */
export const darkTheme: Theme = {
  name: 'dark',
  bgGradient: ['#070713', '#0E0E24', '#15153A'],
  bg: '#0A0A1A',
  blurTint: 'dark',
  blurIntensity: 28,

  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(255, 255, 255, 0.10)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.16)',
  glassShadow: 'rgba(0, 0, 0, 0.55)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textMuted: 'rgba(255, 255, 255, 0.42)',
  textOnAccent: '#FFFFFF',

  primary: '#7C7BFF',
  primarySoft: 'rgba(124, 123, 255, 0.16)',
  primaryGlow: 'rgba(124, 123, 255, 0.45)',
  accent: '#00D4AA',
  accentSoft: 'rgba(0, 212, 170, 0.16)',

  online: '#3FE0A2',
  danger: '#FF5A6E',
  warning: '#FFB020',
  success: '#3FE0A2',
  info: '#4FB6FF',

  priorityUrgent: '#FF5A6E',
  priorityHigh: '#FF9F43',
  priorityMedium: '#FFC542',
  priorityLow: '#3FE0A2',

  bubbleAgent: 'rgba(124, 123, 255, 0.14)',
  bubbleAgentBorder: 'rgba(124, 123, 255, 0.28)',
  bubbleUser: 'rgba(0, 212, 170, 0.14)',
  bubbleUserBorder: 'rgba(0, 212, 170, 0.30)',

  vizNode: 'rgba(124, 123, 255, 0.85)',
  vizNodeCore: '#B9B8FF',
  vizLink: 'rgba(124, 123, 255, 0.35)',
  vizGrid: 'rgba(255, 255, 255, 0.06)',
};

/**
 * Light theme — inspired by Claude's warm, paper-like palette (cream background,
 * coral accent) rendered as soft "liquid glass": translucent frosted surfaces,
 * discreet low-contrast icons, gentle depth.
 */
export const lightTheme: Theme = {
  name: 'light',
  bgGradient: ['#FAF9F5', '#F2EFE6', '#EAE6DA'],
  bg: '#F5F3EC',
  blurTint: 'light',
  blurIntensity: 40,

  glass: 'rgba(255, 255, 255, 0.55)',
  glassStrong: 'rgba(255, 255, 255, 0.74)',
  glassBorder: 'rgba(60, 50, 40, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 0.85)',
  glassShadow: 'rgba(70, 55, 40, 0.16)',

  textPrimary: '#262220',
  textSecondary: 'rgba(38, 34, 32, 0.66)',
  textMuted: 'rgba(38, 34, 32, 0.40)',
  textOnAccent: '#FFFFFF',

  primary: '#C96442',
  primarySoft: 'rgba(201, 100, 66, 0.12)',
  primaryGlow: 'rgba(201, 100, 66, 0.30)',
  accent: '#1F8A70',
  accentSoft: 'rgba(31, 138, 112, 0.12)',

  online: '#1F8A70',
  danger: '#D9534F',
  warning: '#C77D11',
  success: '#1F8A70',
  info: '#2F7DB8',

  priorityUrgent: '#D9534F',
  priorityHigh: '#D9822B',
  priorityMedium: '#C9A227',
  priorityLow: '#1F8A70',

  bubbleAgent: 'rgba(201, 100, 66, 0.10)',
  bubbleAgentBorder: 'rgba(201, 100, 66, 0.22)',
  bubbleUser: 'rgba(31, 138, 112, 0.10)',
  bubbleUserBorder: 'rgba(31, 138, 112, 0.24)',

  vizNode: 'rgba(201, 100, 66, 0.85)',
  vizNodeCore: '#C96442',
  vizLink: 'rgba(201, 100, 66, 0.30)',
  vizGrid: 'rgba(38, 34, 32, 0.07)',
};

export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
