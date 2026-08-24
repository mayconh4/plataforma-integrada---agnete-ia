// Black & white terminal palette: pure black background, white/gray text,
// no color accents. Legacy glass* keys kept as grayscale values so older
// references keep working.
export const colors = {
  glassBg: '#1A1A1A',
  glassBorder: '#3A3A3A',
  glassHighlight: '#4A4A4A',
  glassShadow: '#000000',
  primary: '#FFFFFF', // user / primary action
  primaryGlow: 'rgba(255, 255, 255, 0.15)',
  accent: '#D0D0D0', // hermes
  danger: '#FFFFFF',
  background: '#000000', // pure black terminal
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#000000',
  surface: '#0A0A0A', // header / input bar
  surfaceRaised: '#141414', // message / control fill
  border: '#3A3A3A', // solid divider / outline
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  hermesBubble: '#141414',
  userBubble: '#141414',
};
