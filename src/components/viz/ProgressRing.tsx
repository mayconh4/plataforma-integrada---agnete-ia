import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  centerText?: string;
}

export function ProgressRing({ value, size = 84, stroke = 8, color, label, centerText }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.vizGrid} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={c}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * v} ${circ}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { color: colors.textPrimary, fontSize: size * 0.26 }]}>
            {centerText ?? `${Math.round(v * 100)}%`}
          </Text>
        </View>
      </View>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '800' },
  label: { fontSize: 11.5, fontWeight: '600', marginTop: 6 },
});
