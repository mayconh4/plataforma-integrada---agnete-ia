import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { mono } from '../theme/typography';
import { ContextButton } from '../types/chat';

interface Props {
  button: ContextButton;
  onPress: (action: string) => void;
}

export function LiquidGlassButton({ button, onPress }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  const variant = button.variant || 'secondary';
  const accent = {
    primary: colors.primary,
    secondary: colors.border,
    danger: colors.danger,
    ghost: colors.textMuted,
  }[variant];

  const handlePressIn = () => {
    Animated.timing(opacity, { toValue: 0.6, duration: 60, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(button.action);
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.container, { borderColor: accent }]}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.content}>
          {button.icon && <Text style={styles.icon}>{button.icon}</Text>}
          <Text style={[styles.label, { color: variant === 'ghost' ? colors.textMuted : colors.textPrimary }]}>
            {button.label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 6,
    marginVertical: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    // sharp corners — no borderRadius
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontFamily: mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
