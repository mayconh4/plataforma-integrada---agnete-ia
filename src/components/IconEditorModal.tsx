import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { IconData } from '../store/types';
import { GlassView } from './glass/GlassView';
import { GlassButton } from './glass/GlassButton';
import { ICON_FRAME } from './EditableIcon';

const EMOJIS = ['🎯', '💈', '💅', '🤖', '🧠', '🔄', '📋', '⚡', '🚀', '💡', '🛒', '📈', '🔔', '🎮', '🐍', '✨'];
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

interface Props {
  visible: boolean;
  initial: IconData;
  title?: string;
  onCancel: () => void;
  onSave: (icon: IconData) => void;
}

const clampJS = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function IconEditorModal({ visible, initial, title = 'Editar ícone', onCancel, onSave }: Props) {
  const { theme } = useTheme();

  const [emoji, setEmoji] = useState(initial.emoji);
  const [imageUri, setImageUri] = useState<string | undefined>(initial.imageUri);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(initial.scale ?? 1);
  const savedScale = useSharedValue(initial.scale ?? 1);
  const tx = useSharedValue(initial.offsetX ?? 0);
  const ty = useSharedValue(initial.offsetY ?? 0);
  const savedTx = useSharedValue(initial.offsetX ?? 0);
  const savedTy = useSharedValue(initial.offsetY ?? 0);

  // Re-sync when opened for a different object.
  useEffect(() => {
    if (!visible) return;
    setEmoji(initial.emoji);
    setImageUri(initial.imageUri);
    scale.value = initial.scale ?? 1;
    savedScale.value = initial.scale ?? 1;
    tx.value = initial.offsetX ?? 0;
    ty.value = initial.offsetY ?? 0;
    savedTx.value = initial.offsetX ?? 0;
    savedTy.value = initial.offsetY ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      setLoading(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImageUri(res.assets[0].uri);
        // reset transform for the fresh image
        scale.value = 1;
        savedScale.value = 1;
        tx.value = 0;
        ty.value = 0;
        savedTx.value = 0;
        savedTy.value = 0;
      }
    } finally {
      setLoading(false);
    }
  };

  const nudgeZoom = (dir: 1 | -1) => {
    const next = clampJS((scale.value || 1) + dir * 0.25, MIN_SCALE, MAX_SCALE);
    scale.value = next;
    savedScale.value = next;
    Haptics.selectionAsync().catch(() => {});
  };

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSave({
      emoji,
      imageUri,
      scale: scale.value,
      offsetX: tx.value,
      offsetY: ty.value,
      bg: initial.bg,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={[styles.backdrop, { backgroundColor: theme.name === 'light' ? 'rgba(40,34,30,0.35)' : 'rgba(0,0,0,0.6)' }]}>
        <GlassView strong radius={28} style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Arraste e use pinça para dar zoom. Ou escolha um emoji.
            </Text>

            {/* Adjuster frame */}
            <View style={styles.frameWrap}>
              <View style={[styles.frame, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
                {imageUri ? (
                  <GestureDetector gesture={composed}>
                    <Animated.View style={styles.frameInner}>
                      <Animated.Image
                        source={{ uri: imageUri }}
                        style={[{ width: ICON_FRAME, height: ICON_FRAME }, imageStyle]}
                        resizeMode="cover"
                      />
                    </Animated.View>
                  </GestureDetector>
                ) : (
                  <View style={styles.frameInner}>
                    <Text style={{ fontSize: ICON_FRAME * 0.5 }}>{emoji}</Text>
                  </View>
                )}
                {/* circular guide overlay */}
                <View pointerEvents="none" style={[styles.guide, { borderColor: theme.primary }]} />
                {loading && (
                  <View style={[StyleSheet.absoluteFill, styles.loading]}>
                    <ActivityIndicator color={theme.primary} />
                  </View>
                )}
              </View>
            </View>

            {imageUri && (
              <View style={styles.zoomRow}>
                <ZoomBtn label="−" onPress={() => nudgeZoom(-1)} theme={theme} />
                <Pressable onPress={resetTransform} style={[styles.resetBtn, { borderColor: theme.glassBorder }]}>
                  <Text style={[styles.resetTxt, { color: theme.textSecondary }]}>Resetar</Text>
                </Pressable>
                <ZoomBtn label="+" onPress={() => nudgeZoom(1)} theme={theme} />
              </View>
            )}

            <GlassButton
              label={imageUri ? 'Trocar imagem' : 'Enviar imagem'}
              icon="🖼️"
              variant="primary"
              onPress={pickImage}
              style={styles.full}
            />
            {imageUri && (
              <Pressable onPress={() => setImageUri(undefined)} style={styles.removeRow}>
                <Text style={[styles.removeTxt, { color: theme.danger }]}>Remover imagem e usar emoji</Text>
              </Pressable>
            )}

            <Text style={[styles.section, { color: theme.textMuted }]}>EMOJIS</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => {
                    setEmoji(e);
                    setImageUri(undefined);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  style={[
                    styles.emojiCell,
                    {
                      borderColor: !imageUri && emoji === e ? theme.primary : theme.glassBorder,
                      backgroundColor: !imageUri && emoji === e ? theme.primarySoft : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.emojiTxt}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actions}>
              <GlassButton label="Cancelar" variant="ghost" onPress={onCancel} style={styles.flex1} />
              <GlassButton label="Salvar" variant="primary" onPress={handleSave} style={styles.flex1} />
            </View>
          </ScrollView>
        </GlassView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomBtn({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable onPress={onPress} style={[styles.zoomBtn, { borderColor: theme.glassBorder, backgroundColor: theme.glass }]}>
      <Text style={[styles.zoomTxt, { color: theme.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 420, maxHeight: '92%' },
  scroll: { padding: 20 },
  title: { fontSize: 19, fontWeight: '700' },
  hint: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  frameWrap: { alignItems: 'center', marginTop: 16 },
  frame: {
    width: ICON_FRAME,
    height: ICON_FRAME,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameInner: { width: ICON_FRAME, height: ICON_FRAME, alignItems: 'center', justifyContent: 'center' },
  guide: {
    position: 'absolute',
    width: ICON_FRAME - 24,
    height: ICON_FRAME - 24,
    borderRadius: (ICON_FRAME - 24) / 2,
    borderWidth: 2,
    opacity: 0.5,
  },
  loading: { alignItems: 'center', justifyContent: 'center' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
  zoomBtn: { width: 46, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  zoomTxt: { fontSize: 22, fontWeight: '600' },
  resetBtn: { paddingHorizontal: 16, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetTxt: { fontSize: 13, fontWeight: '600' },
  full: { marginTop: 16 },
  removeRow: { alignItems: 'center', paddingVertical: 10 },
  removeTxt: { fontSize: 13, fontWeight: '600' },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emojiTxt: { fontSize: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  flex1: { flex: 1 },
});
