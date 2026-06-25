import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius for the surface and its clip mask. */
  radius?: number;
  /** Use the stronger (more opaque) glass tint. */
  strong?: boolean;
  /** Override blur intensity. */
  intensity?: number;
  /** Hide the 1px hairline border. */
  noBorder?: boolean;
  /** Hide the subtle top highlight that sells the "liquid glass" look. */
  noHighlight?: boolean;
}

/**
 * The core "liquid glass" surface: a blur layer, a translucent tint on top (so it
 * still reads as glass when the platform blur is weak), a hairline border and a
 * soft top highlight. Fully theme-aware (light/dark).
 */
export function GlassView({
  children,
  style,
  radius = 22,
  strong = false,
  intensity,
  noBorder = false,
  noHighlight = false,
}: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius,
          borderWidth: noBorder ? 0 : StyleSheet.hairlineWidth,
          borderColor: theme.glassBorder,
          shadowColor: theme.glassShadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity ?? theme.blurIntensity}
        tint={theme.blurTint}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? theme.glassStrong : theme.glass, borderRadius: radius },
        ]}
      />
      {!noHighlight && (
        <View
          style={[
            styles.highlight,
            { backgroundColor: theme.glassHighlight, borderTopLeftRadius: radius, borderTopRightRadius: radius },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 6,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.7,
  },
  content: {
    flex: 0,
  },
});
