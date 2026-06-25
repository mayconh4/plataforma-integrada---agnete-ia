import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { IconData } from '../store/types';

/**
 * Reference frame size used by the icon editor. Stored pan offsets are expressed
 * in this coordinate space; EditableIcon scales them proportionally so an icon
 * adjusted in the editor looks identical at any render size.
 */
export const ICON_FRAME = 240;

interface Props {
  icon: IconData;
  size?: number;
  /** Round (circle) vs rounded-square frame. */
  round?: boolean;
  onPress?: () => void;
  /** Show a small pencil badge hinting the icon is editable. */
  showEditBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EditableIcon({
  icon,
  size = 48,
  round = false,
  onPress,
  showEditBadge = false,
  style,
}: Props) {
  const { theme } = useTheme();
  const radius = round ? size / 2 : size * 0.28;
  const f = size / ICON_FRAME;

  const body = (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: icon.bg ?? theme.glassStrong,
          borderColor: theme.glassBorder,
        },
        style,
      ]}
    >
      {icon.imageUri ? (
        <Image
          source={{ uri: icon.imageUri }}
          style={{
            width: size,
            height: size,
            transform: [
              { translateX: (icon.offsetX ?? 0) * f },
              { translateY: (icon.offsetY ?? 0) * f },
              { scale: icon.scale ?? 1 },
            ],
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{icon.emoji}</Text>
      )}

      {showEditBadge && (
        <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.bg }]}>
          <Text style={styles.badgeIcon}>✎</Text>
        </View>
      )}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
