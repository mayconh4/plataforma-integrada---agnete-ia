import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChatMessage } from '../types/chat';
import { ContextualButtons } from './ContextualButtons';
import { SuggestionChips } from './SuggestionChips';
import { SpeakButton } from './SpeakButton';
import { splitSegments } from '../lib/textFormat';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

interface Props {
  message: ChatMessage;
  onButtonPress: (action: string, label: string) => void;
  onSuggestionPress: (text: string) => void;
}

/** Bloco técnico recolhido (caminhos/código) que expande ao tocar no "+". */
function TechBlock({ content }: { content: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.tech}>
      <TouchableOpacity style={styles.techHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Text style={styles.techPlus}>{open ? '−' : '+'}</Text>
        <Text style={styles.techLabel}>{open ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}</Text>
      </TouchableOpacity>
      {open && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techScroll}>
          <Text style={styles.techText}>{content}</Text>
        </ScrollView>
      )}
    </View>
  );
}

export function ChatBubble({ message, onButtonPress, onSuggestionPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isViper = message.role === 'hermes';
  const segments = splitSegments(message.text);

  return (
    <View style={[styles.row, isViper ? styles.rowViper : styles.rowUser]}>
      {isViper && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🐍</Text>
        </View>
      )}
      <View style={[styles.bubbleContainer, isViper ? styles.viperBubble : styles.userBubble]}>
        <BlurView intensity={22} tint={colors.blurTint} style={styles.blur}>
          {segments.map((seg, i) =>
            seg.type === 'tech' ? (
              <TechBlock key={i} content={seg.content} />
            ) : (
              <Text key={i} style={styles.text}>
                {seg.content}
              </Text>
            ),
          )}
          {isViper && message.buttons && message.buttons.length > 0 && (
            <ContextualButtons buttons={message.buttons} onPress={onButtonPress} />
          )}
          {isViper && message.suggestions && message.suggestions.length > 0 && (
            <SuggestionChips suggestions={message.suggestions} onPress={onSuggestionPress} />
          )}
          {isViper && (
            <View style={styles.footer}>
              <SpeakButton id={message.id} text={message.text} size={28} />
              <Text style={styles.footerHint}>Ouvir</Text>
            </View>
          )}
        </BlurView>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 12, alignItems: 'flex-end' },
    rowViper: { justifyContent: 'flex-start' },
    rowUser: { justifyContent: 'flex-end' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
    avatarText: { fontSize: 15 },
    bubbleContainer: { maxWidth: '82%', borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
    viperBubble: { borderColor: colors.glassBorder, backgroundColor: colors.viperBubble },
    userBubble: { borderColor: colors.glassBorder, backgroundColor: colors.userBubble },
    blur: { paddingHorizontal: 16, paddingVertical: 12 },
    text: { fontSize: 15, lineHeight: 22, color: colors.textPrimary },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    footerHint: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
    tech: { marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceSoft, overflow: 'hidden' },
    techHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
    techPlus: { color: colors.accent, fontSize: 16, fontWeight: '800', width: 14, textAlign: 'center' },
    techLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    techScroll: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
    techText: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, padding: 12, fontFamily: 'monospace' },
  });
