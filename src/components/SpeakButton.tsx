import React, { useEffect, useRef } from 'react';
import { Pressable, View, StyleSheet, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  /** Stable id for the text (so the right button reflects playback). */
  id: string;
  text: string;
  size?: number;
  /** Use the accent colour instead of primary when active. */
  accent?: boolean;
}

/**
 * A play/pause control bound to a piece of text. Tap to speak it; tap again to
 * pause (iOS) / stop (Android). Reflects the global speech state so only one
 * text plays at a time and every button stays in sync.
 */
export function SpeakButton({ id, text, size = 30, accent = false }: Props) {
  const { theme } = useTheme();
  const { statusFor, toggle } = useSpeech();
  const status = statusFor(id);
  const active = status === 'playing';

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [active, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const tint = accent ? theme.accent : theme.primary;
  const glyphColor = active || status === 'paused' ? tint : theme.textSecondary;
  const inner = size * 0.4;

  const handle = () => {
    Haptics.selectionAsync().catch(() => {});
    toggle(id, text);
  };

  return (
    <Pressable hitSlop={8} onPress={handle} style={{ width: size, height: size }}>
      {active && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.ring,
            { borderColor: tint, borderRadius: size / 2, transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
      )}
      <View
        style={[
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? theme.primarySoft : theme.glass,
            borderColor: active ? tint : theme.glassBorder,
          },
        ]}
      >
        {active ? (
          <View style={styles.pauseRow}>
            <View style={[styles.bar, { height: inner, backgroundColor: glyphColor }]} />
            <View style={[styles.bar, { height: inner, backgroundColor: glyphColor }]} />
          </View>
        ) : (
          <View
            style={[
              styles.play,
              {
                borderLeftColor: glyphColor,
                borderLeftWidth: inner * 0.95,
                borderTopWidth: inner * 0.6,
                borderBottomWidth: inner * 0.6,
                marginLeft: inner * 0.28,
              },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 1.5 },
  btn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pauseRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  bar: { width: 3, borderRadius: 1.5 },
  play: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
