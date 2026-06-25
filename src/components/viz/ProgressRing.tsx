import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  /** Center text; defaults to percentage. */
  centerText?: string;
}

/** A circular progress ring (SVG) used for uptime / intelligence indices. */
export function ProgressRing({ value, size = 84, stroke = 8, color, label, centerText }: Props) {
  const { theme } = useTheme();
  const c = color ?? theme.primary;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const dash = circ * clamped;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.vizGrid} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={c}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { color: theme.textPrimary, fontSize: size * 0.26 }]}>
            {centerText ?? `${Math.round(clamped * 100)}%`}
          </Text>
        </View>
      </View>
      {label ? <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: '800' },
  label: { fontSize: 11.5, fontWeight: '600', marginTop: 6, letterSpacing: 0.3 },
});
