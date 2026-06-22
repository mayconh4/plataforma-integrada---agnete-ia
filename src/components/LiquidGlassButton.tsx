import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { ContextButton } from '../types/chat';

interface Props {
  button: ContextButton;
  onPress: (action: string, label: string) => void;
}

export function LiquidGlassButton({ button, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const variantStyles = {
    primary: { borderColor: colors.primary, shadowColor: colors.primaryGlow },
    secondary: { borderColor: colors.glassBorder, shadowColor: colors.glassShadow },
    danger: { borderColor: colors.danger, shadowColor: 'rgba(255, 71, 87, 0.3)' },
    ghost: { borderColor: 'rgba(255,255,255,0.1)', shadowColor: 'transparent' },
  };

  const variant = button.variant || 'secondary';
  const style = variantStyles[variant];

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.92, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(button.action, button.label);
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }], opacity }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.container,
          {
            borderColor: style.borderColor,
            shadowColor: style.shadowColor,
          },
        ]}
      >
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.innerHighlight} />
          <View style={styles.content}>
            {button.icon && <Text style={styles.icon}>{button.icon}</Text>}
            <Text
              style={[
                styles.label,
                variant === 'primary' && styles.labelPrimary,
                variant === 'danger' && styles.labelDanger,
              ]}
            >
              {button.label}
            </Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blur: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'relative',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelPrimary: {
    color: '#B8B3FF',
  },
  labelDanger: {
    color: '#FF7B86',
  },
});
