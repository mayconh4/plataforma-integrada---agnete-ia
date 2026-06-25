import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, View, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export type GlassButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  icon?: string;
  variant?: GlassButtonVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

/** A tactile, theme-aware liquid-glass pill button with a spring press animation. */
export function GlassButton({ label, icon, variant = 'secondary', onPress, style, small }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const palette: Record<GlassButtonVariant, { bg: string; border: string; text: string }> = {
    primary: { bg: theme.primarySoft, border: theme.primary, text: theme.primary },
    secondary: { bg: theme.glass, border: theme.glassBorder, text: theme.textPrimary },
    danger: { bg: 'transparent', border: theme.danger, text: theme.danger },
    ghost: { bg: 'transparent', border: theme.glassBorder, text: theme.textSecondary },
  };
  const p = palette[variant];

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, friction: 5, tension: 300 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 400 }).start();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.btn,
          small && styles.btnSmall,
          { backgroundColor: p.bg, borderColor: p.border },
        ]}
      >
        <View style={styles.row}>
          {icon ? <Text style={[styles.icon, small && styles.iconSmall]}>{icon}</Text> : null}
          <Text style={[styles.label, small && styles.labelSmall, { color: p.text }]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  btnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 13,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  icon: { fontSize: 15 },
  iconSmall: { fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  labelSmall: { fontSize: 12.5, fontWeight: '600' },
});
