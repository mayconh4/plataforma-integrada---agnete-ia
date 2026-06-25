import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { BrainRegion } from '../../store/types';

interface Props {
  regions: BrainRegion[];
  width?: number;
  height?: number;
}

/**
 * A neural "brain" map of the agent: each region (core, memory, expansion,
 * language, planning, perception) is a node whose size + glow reflect its
 * activation. Nodes are wired to the core and to each other to read as a living
 * network — a visual sense of the agent's intelligence, memory and growth.
 */
export function BrainGraph({ regions, width = 320, height = 230 }: Props) {
  const { theme } = useTheme();
  const padX = 34;
  const padY = 26;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const pts = regions.map((r) => ({
    ...r,
    px: padX + r.x * w,
    py: padY + r.y * h,
    radius: 7 + r.level * 16,
  }));

  const core = pts.find((p) => p.id === 'core') ?? pts[0];

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.vizNodeCore} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={theme.vizNodeCore} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* links: each node to core */}
        {pts.map((p) =>
          p.id === core.id ? null : (
            <Line
              key={`l-${p.id}`}
              x1={core.px}
              y1={core.py}
              x2={p.px}
              y2={p.py}
              stroke={theme.vizLink}
              strokeWidth={1 + p.level * 2}
            />
          )
        )}
        {/* ring links between consecutive nodes for a networked look */}
        {pts.map((p, i) => {
          const next = pts[(i + 1) % pts.length];
          if (p.id === core.id || next.id === core.id) return null;
          return (
            <Line
              key={`r-${p.id}`}
              x1={p.px}
              y1={p.py}
              x2={next.px}
              y2={next.py}
              stroke={theme.vizLink}
              strokeWidth={0.75}
              strokeDasharray="3 4"
            />
          );
        })}

        {/* glow halo for core */}
        <Circle cx={core.px} cy={core.py} r={core.radius * 2.4} fill="url(#coreGlow)" />

        {/* nodes */}
        {pts.map((p) => {
          const isCore = p.id === core.id;
          return (
            <React.Fragment key={`n-${p.id}`}>
              <Circle cx={p.px} cy={p.py} r={p.radius + 4} fill={theme.vizNode} opacity={0.18} />
              <Circle
                cx={p.px}
                cy={p.py}
                r={p.radius}
                fill={isCore ? theme.vizNodeCore : theme.vizNode}
                opacity={isCore ? 1 : 0.85}
              />
              <SvgText
                x={p.px}
                y={p.py + p.radius + 13}
                fill={theme.textMuted}
                fontSize={9.5}
                fontWeight="600"
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
