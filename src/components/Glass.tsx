import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

/**
 * Cartão de "vidro líquido" (glassmorphism) — blur + borda translúcida + brilho.
 * Inspirado no visual de vidro do iOS recente.
 */
export function GlassCard({
  children,
  style,
  intensity = 28,
  glow = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  glow?: boolean;
}) {
  return (
    <View style={[styles.cardShadow, glow && styles.cardGlow, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.cardInner}>
        <View style={styles.sheen} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

/** Botão de vidro (pílula) com variações de cor. */
export function GlassButton({
  label,
  icon,
  onPress,
  variant = 'default',
  style,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const tint =
    variant === 'primary'
      ? { borderColor: colors.primary, backgroundColor: colors.primaryGlow }
      : variant === 'accent'
      ? { borderColor: colors.accent, backgroundColor: colors.accentGlow }
      : variant === 'danger'
      ? { borderColor: colors.danger, backgroundColor: 'rgba(255,92,114,0.18)' }
      : { borderColor: colors.glassBorder, backgroundColor: colors.glassBg };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.btnShadow, style]}>
      <BlurView intensity={24} tint="dark" style={[styles.btn, tint]}>
        {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
        <Text style={styles.btnLabel}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  cardGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 22,
  },
  cardInner: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
    opacity: 0.5,
  },
  btnShadow: {
    borderRadius: 18,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btnIcon: { fontSize: 14 },
  btnLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
