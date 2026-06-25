import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { IconData } from '../intel/types';
import { ICON_FRAME } from './EditableIcon';

const EMOJIS = ['🎯', '💈', '💅', '🤖', '🧠', '🔄', '📋', '⚡', '🚀', '💡', '🛒', '📈', '🔔', '🎮', '🐍', '✨'];
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const clampJS = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Props {
  visible: boolean;
  initial: IconData;
  title?: string;
  onCancel: () => void;
  onSave: (icon: IconData) => void;
}

export function IconEditorModal({ visible, initial, title = 'Editar ícone', onCancel, onSave }: Props) {
  const { colors, name } = useTheme();
  const [emoji, setEmoji] = useState(initial.emoji);
  const [imageUri, setImageUri] = useState<string | undefined>(initial.imageUri);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(initial.scale ?? 1);
  const savedScale = useSharedValue(initial.scale ?? 1);
  const tx = useSharedValue(initial.offsetX ?? 0);
  const ty = useSharedValue(initial.offsetY ?? 0);
  const savedTx = useSharedValue(initial.offsetX ?? 0);
  const savedTy = useSharedValue(initial.offsetY ?? 0);

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
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
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
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9 });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImageUri(res.assets[0].uri);
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

  const nudge = (dir: 1 | -1) => {
    const next = clampJS((scale.value || 1) + dir * 0.25, MIN_SCALE, MAX_SCALE);
    scale.value = next;
    savedScale.value = next;
    Haptics.selectionAsync().catch(() => {});
  };
  const reset = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const save = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSave({ emoji, imageUri, scale: scale.value, offsetX: tx.value, offsetY: ty.value, bg: initial.bg });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={[styles.backdrop, { backgroundColor: name === 'light' ? 'rgba(40,34,30,0.35)' : 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>Arraste e use pinça para dar zoom, ou escolha um emoji.</Text>

            <View style={styles.frameWrap}>
              <View style={[styles.frame, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]}>
                {imageUri ? (
                  <GestureDetector gesture={composed}>
                    <Animated.View style={styles.frameInner}>
                      <Animated.Image source={{ uri: imageUri }} style={[{ width: ICON_FRAME, height: ICON_FRAME }, imageStyle]} resizeMode="cover" />
                    </Animated.View>
                  </GestureDetector>
                ) : (
                  <View style={styles.frameInner}>
                    <Text style={{ fontSize: ICON_FRAME * 0.5 }}>{emoji}</Text>
                  </View>
                )}
                <View pointerEvents="none" style={[styles.guide, { borderColor: colors.primary }]} />
                {loading && (
                  <View style={[StyleSheet.absoluteFill, styles.loading]}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
              </View>
            </View>

            {imageUri && (
              <View style={styles.zoomRow}>
                <Pressable onPress={() => nudge(-1)} style={[styles.zoomBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]}>
                  <Text style={[styles.zoomTxt, { color: colors.textPrimary }]}>−</Text>
                </Pressable>
                <Pressable onPress={reset} style={[styles.resetBtn, { borderColor: colors.glassBorder }]}>
                  <Text style={[styles.resetTxt, { color: colors.textSecondary }]}>Resetar</Text>
                </Pressable>
                <Pressable onPress={() => nudge(1)} style={[styles.zoomBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }]}>
                  <Text style={[styles.zoomTxt, { color: colors.textPrimary }]}>＋</Text>
                </Pressable>
              </View>
            )}

            <Pressable onPress={pickImage} style={[styles.fullBtn, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
              <Text style={[styles.fullBtnTxt, { color: colors.primary }]}>🖼️  {imageUri ? 'Trocar imagem' : 'Enviar imagem'}</Text>
            </Pressable>
            {imageUri && (
              <Pressable onPress={() => setImageUri(undefined)} style={styles.removeRow}>
                <Text style={[styles.removeTxt, { color: colors.danger }]}>Remover imagem e usar emoji</Text>
              </Pressable>
            )}

            <Text style={[styles.section, { color: colors.textMuted }]}>EMOJIS</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => {
                const sel = !imageUri && emoji === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => {
                      setEmoji(e);
                      setImageUri(undefined);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    style={[styles.emojiCell, { borderColor: sel ? colors.primary : colors.glassBorder, backgroundColor: sel ? colors.primaryGlow : 'transparent' }]}
                  >
                    <Text style={styles.emojiTxt}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={[styles.actionBtn, { borderColor: colors.glassBorder }]}>
                <Text style={[styles.actionTxt, { color: colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={save} style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[styles.actionTxt, { color: colors.textOnAccent }]}>Salvar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 420, maxHeight: '92%', borderRadius: 28, borderWidth: 1 },
  scroll: { padding: 20 },
  title: { fontSize: 19, fontWeight: '700' },
  hint: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  frameWrap: { alignItems: 'center', marginTop: 16 },
  frame: { width: ICON_FRAME, height: ICON_FRAME, borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  frameInner: { width: ICON_FRAME, height: ICON_FRAME, alignItems: 'center', justifyContent: 'center' },
  guide: { position: 'absolute', width: ICON_FRAME - 24, height: ICON_FRAME - 24, borderRadius: (ICON_FRAME - 24) / 2, borderWidth: 2, opacity: 0.5 },
  loading: { alignItems: 'center', justifyContent: 'center' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
  zoomBtn: { width: 46, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  zoomTxt: { fontSize: 22, fontWeight: '600' },
  resetBtn: { paddingHorizontal: 16, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetTxt: { fontSize: 13, fontWeight: '600' },
  fullBtn: { marginTop: 16, borderWidth: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  fullBtnTxt: { fontSize: 14, fontWeight: '700' },
  removeRow: { alignItems: 'center', paddingVertical: 10 },
  removeTxt: { fontSize: 13, fontWeight: '600' },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emojiTxt: { fontSize: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  actionTxt: { fontSize: 14, fontWeight: '700' },
});
