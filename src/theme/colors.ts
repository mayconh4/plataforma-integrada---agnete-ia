// PowerShell-inspired palette: solid PowerShell blue, terminal accents,
// no translucency. Legacy glass* keys are kept as opaque values so older
// references keep working, but the design no longer uses blur.
export const colors = {
  glassBg: '#013A87',
  glassBorder: '#2C6FD6',
  glassHighlight: '#3C82F0',
  glassShadow: '#000000',
  primary: '#FFD866', // PowerShell prompt yellow
  primaryGlow: 'rgba(255, 216, 102, 0.25)',
  accent: '#5BE3C0', // terminal cyan-green
  danger: '#FF6B6B',
  background: '#012456', // classic PowerShell blue
  backgroundGradientStart: '#012456',
  backgroundGradientEnd: '#012456',
  surface: '#001A40', // darker panel (header / input bar)
  surfaceRaised: '#01337A', // message / control fill
  border: '#2C6FD6', // solid divider / outline
  textPrimary: '#EEEDF0', // PowerShell light gray text
  textSecondary: '#B7C4DE',
  textMuted: '#6E85AD',
  hermesBubble: '#01337A',
  userBubble: '#013A87',
};
