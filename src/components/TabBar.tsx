import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { GlassView } from './glass/GlassView';

export type TabKey = 'resumo' | 'tarefas' | 'chat' | 'projetos' | 'metas';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'resumo', label: 'Resumo', icon: '📊' },
  { key: 'tarefas', label: 'Tarefas', icon: '✅' },
  { key: 'chat', label: '', icon: '🎙️' }, // center voice button
  { key: 'projetos', label: 'Projetos', icon: '📁' },
  { key: 'metas', label: 'Metas', icon: '🎯' },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
  /** Pulse the center mic when Viper is "listening"/speaking. */
  listening?: boolean;
}

export function TabBar({ active, onChange, listening = false }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    glow.setValue(0);
  }, [listening, glow]);

  const press = (key: TabKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(key);
  };

  const micScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.6] });

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <GlassView strong radius={30} style={styles.bar}>
        <View style={styles.row}>
          {TABS.map((t) => {
            if (t.key === 'chat') {
              const isActive = active === 'chat';
              return (
                <Pressable key={t.key} onPress={() => press(t.key)} style={styles.centerSlot}>
                  <Animated.View
                    style={[
                      styles.micRing,
                      { borderColor: theme.primary, opacity: ringOpacity, transform: [{ scale: micScale.interpolate({ inputRange: [1, 1.06], outputRange: [1.2, 1.5] }) }] },
                    ]}
                  />
                  <Animated.View style={{ transform: [{ scale: micScale }] }}>
                    <LinearGradient
                      colors={[theme.primary, theme.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.mic, { borderColor: isActive ? theme.glassHighlight : 'transparent', shadowColor: theme.primaryGlow }]}
                    >
                      <Text style={styles.micIcon}>{t.icon}</Text>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
              );
            }
            const isActive = active === t.key;
            return (
              <Pressable key={t.key} onPress={() => press(t.key)} style={styles.tab}>
                <Text style={[styles.icon, { opacity: isActive ? 1 : 0.5 }]}>{t.icon}</Text>
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? theme.textPrimary : theme.textMuted, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bar: { width: '100%', maxWidth: 520, paddingVertical: 10, paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  icon: { fontSize: 22 },
  label: { fontSize: 10.5, letterSpacing: 0.2 },
  centerSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2 },
  mic: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  micIcon: { fontSize: 26 },
});
