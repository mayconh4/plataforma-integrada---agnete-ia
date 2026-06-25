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
  fmt?: (v: number) => string;
}

/** Stepper numérico −/valor/＋, limitado a [min, max]. */
export function Stepper({ value, onChange, step, min, max, fmt }: Props) {
  const { colors } = useTheme();
  const set = (v: number) => {
    onChange(Math.max(min, Math.min(max, Math.round(v * 1000) / 1000)));
    Haptics.selectionAsync().catch(() => {});
  };
  return (
    <View style={styles.row}>
      <Pressable onPress={() => set(value - step)} style={[styles.btn, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]}>
        <Text style={[styles.sym, { color: colors.textPrimary }]}>−</Text>
      </Pressable>
      <Text style={[styles.val, { color: colors.textPrimary }]}>{fmt ? fmt(value) : String(value)}</Text>
      <Pressable onPress={() => set(value + step)} style={[styles.btn, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]}>
        <Text style={[styles.sym, { color: colors.textPrimary }]}>＋</Text>
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
