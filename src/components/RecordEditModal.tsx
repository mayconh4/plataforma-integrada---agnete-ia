import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Priority } from '../store/types';
import { GlassView } from './glass/GlassView';
import { GlassButton } from './glass/GlassButton';
import { PRIORITY_LABEL, PRIORITY_ORDER, priorityColor } from '../utils/priority';

export interface RecordDraft {
  title: string;
  note: string;
  priority?: Priority;
  progress?: number;
}

interface Props {
  visible: boolean;
  heading: string;
  titleLabel?: string;
  noteLabel?: string;
  initial: RecordDraft;
  showPriority?: boolean;
  showProgress?: boolean;
  canDelete?: boolean;
  onSave: (draft: RecordDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PROGRESS_STEPS = [0, 0.25, 0.5, 0.75, 1];

export function RecordEditModal({
  visible,
  heading,
  titleLabel = 'Título',
  noteLabel = 'Descrição',
  initial,
  showPriority = false,
  showProgress = false,
  canDelete = false,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(initial.title);
  const [note, setNote] = useState(initial.note);
  const [priority, setPriority] = useState<Priority>(initial.priority ?? 'medium');
  const [progress, setProgress] = useState<number>(initial.progress ?? 0);

  useEffect(() => {
    if (!visible) return;
    setTitle(initial.title);
    setNote(initial.note);
    setPriority(initial.priority ?? 'medium');
    setProgress(initial.progress ?? 0);
  }, [visible, initial]);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      note: note.trim(),
      ...(showPriority ? { priority } : {}),
      ...(showProgress ? { progress } : {}),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: theme.name === 'light' ? 'rgba(40,34,30,0.35)' : 'rgba(0,0,0,0.6)' }]}
      >
        <GlassView strong radius={28} style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.heading, { color: theme.textPrimary }]}>{heading}</Text>

            <Text style={[styles.label, { color: theme.textMuted }]}>{titleLabel.toUpperCase()}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={titleLabel}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
              autoFocus
            />

            <Text style={[styles.label, { color: theme.textMuted }]}>{noteLabel.toUpperCase()}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={noteLabel}
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.input, styles.multiline, { color: theme.textPrimary, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            />

            {showPriority && (
              <>
                <Text style={[styles.label, { color: theme.textMuted }]}>PRIORIDADE</Text>
                <View style={styles.segment}>
                  {PRIORITY_ORDER.map((p) => {
                    const selected = p === priority;
                    const c = priorityColor(theme, p);
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setPriority(p)}
                        style={[
                          styles.segItem,
                          { borderColor: selected ? c : theme.glassBorder, backgroundColor: selected ? c + '22' : 'transparent' },
                        ]}
                      >
                        <View style={[styles.segDot, { backgroundColor: c }]} />
                        <Text style={[styles.segTxt, { color: selected ? theme.textPrimary : theme.textSecondary }]}>
                          {PRIORITY_LABEL[p]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {showProgress && (
              <>
                <Text style={[styles.label, { color: theme.textMuted }]}>PROGRESSO · {Math.round(progress * 100)}%</Text>
                <View style={styles.segment}>
                  {PROGRESS_STEPS.map((s) => {
                    const selected = Math.abs(s - progress) < 0.001;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setProgress(s)}
                        style={[
                          styles.stepItem,
                          { borderColor: selected ? theme.primary : theme.glassBorder, backgroundColor: selected ? theme.primarySoft : 'transparent' },
                        ]}
                      >
                        <Text style={[styles.segTxt, { color: selected ? theme.primary : theme.textSecondary }]}>
                          {Math.round(s * 100)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.actions}>
              <GlassButton label="Cancelar" variant="ghost" onPress={onCancel} style={styles.flex1} />
              <GlassButton label="Salvar" variant="primary" onPress={save} style={styles.flex1} />
            </View>

            {canDelete && onDelete && (
              <Pressable onPress={onDelete} style={styles.delete}>
                <Text style={[styles.deleteTxt, { color: theme.danger }]}>Excluir</Text>
              </Pressable>
            )}
          </ScrollView>
        </GlassView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 440, maxHeight: '90%' },
  scroll: { padding: 20 },
  heading: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  segDot: { width: 8, height: 8, borderRadius: 4 },
  segTxt: { fontSize: 13, fontWeight: '600' },
  stepItem: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  flex1: { flex: 1 },
  delete: { alignItems: 'center', paddingVertical: 14 },
  deleteTxt: { fontSize: 14, fontWeight: '700' },
});
