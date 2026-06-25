import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  /** Format the displayed value (e.g. percentage, multiplier). */
  fmt?: (v: number) => string;
}

/** A compact −/value/＋ numeric stepper, clamped to [min, max]. */
export function Stepper({ value, onChange, step, min, max, fmt }: Props) {
  const { theme } = useTheme();
  const set = (v: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(v * 1000) / 1000));
    onChange(clamped);
    Haptics.selectionAsync().catch(() => {});
  };
  return (
    <View style={styles.row}>
      <Pressable onPress={() => set(value - step)} style={[styles.btn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
        <Text style={[styles.sym, { color: theme.textPrimary }]}>−</Text>
      </Pressable>
      <Text style={[styles.val, { color: theme.textPrimary }]}>{fmt ? fmt(value) : String(value)}</Text>
      <Pressable onPress={() => set(value + step)} style={[styles.btn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
        <Text style={[styles.sym, { color: theme.textPrimary }]}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sym: { fontSize: 18, fontWeight: '700' },
  val: { fontSize: 14, fontWeight: '700', minWidth: 48, textAlign: 'center' },
});
