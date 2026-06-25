import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { IconData } from '../intel/types';

/** Tamanho de referência do editor; offsets são guardados neste espaço. */
export const ICON_FRAME = 240;

interface Props {
  icon: IconData;
  size?: number;
  round?: boolean;
  onPress?: () => void;
  showEditBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EditableIcon({ icon, size = 48, round = false, onPress, showEditBadge = false, style }: Props) {
  const { colors } = useTheme();
  const radius = round ? size / 2 : size * 0.28;
  const f = size / ICON_FRAME;

  const body = (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: radius, backgroundColor: icon.bg ?? colors.glassBgStrong, borderColor: colors.glassBorder },
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
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
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
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  badge: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
