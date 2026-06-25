import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FlowNode } from '../../store/types';

const STATE_LABEL: Record<FlowNode['state'], string> = {
  done: 'Concluído',
  active: 'Em andamento',
  next: 'A seguir',
};

/**
 * The project's trajectory drawn as a vertical path: where it has been (done),
 * what's happening now (active, pulsing) and where it's heading (next, dashed).
 */
export function FlowPath({ nodes }: { nodes: FlowNode[] }) {
  const { theme } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const colorFor = (s: FlowNode['state']) =>
    s === 'done' ? theme.accent : s === 'active' ? theme.primary : theme.textMuted;

  return (
    <View>
      {nodes.map((n, i) => {
        const c = colorFor(n.state);
        const isLast = i === nodes.length - 1;
        const topDone = i > 0 && nodes[i - 1].state === 'done';
        const bottomDone = n.state === 'done';
        return (
          <View key={n.id} style={styles.row}>
            <View style={styles.rail}>
              {i > 0 && (
                <View style={[styles.line, styles.lineTop, { backgroundColor: topDone ? theme.accent : theme.vizGrid }]} />
              )}
              {!isLast && (
                <View style={[styles.line, styles.lineBottom, { backgroundColor: bottomDone ? theme.accent : theme.vizGrid }]} />
              )}
              {n.state === 'active' && (
                <Animated.View
                  style={[styles.activeRing, { borderColor: c, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
                />
              )}
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor: n.state === 'next' ? 'transparent' : c,
                    borderColor: c,
                    borderStyle: n.state === 'next' ? 'dashed' : 'solid',
                  },
                ]}
              >
                {n.state === 'done' && <Text style={styles.check}>✓</Text>}
              </View>
            </View>
            <View style={styles.labelWrap}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>{n.label}</Text>
              <Text style={[styles.state, { color: c }]}>{STATE_LABEL[n.state]}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 22;
const RAIL = 36;
const styles = StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 56 },
  rail: { width: RAIL, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', width: 2, left: RAIL / 2 - 1 },
  lineTop: { top: 0, height: '50%' },
  lineBottom: { bottom: 0, height: '50%' },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  activeRing: { position: 'absolute', width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 2 },
  check: { color: '#fff', fontSize: 11, fontWeight: '900' },
  labelWrap: { flex: 1, paddingLeft: 12, paddingVertical: 8, justifyContent: 'center' },
  label: { fontSize: 14.5, fontWeight: '600' },
  state: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
});
