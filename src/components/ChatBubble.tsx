import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ChatMessage } from '../types/chat';
import { ContextualButtons } from './ContextualButtons';
import { SuggestionChips } from './SuggestionChips';
import { SpeakButton } from './SpeakButton';
import { GlassView } from './glass/GlassView';

interface Props {
  message: ChatMessage;
  onButtonPress: (action: string) => void;
  onSuggestionPress: (text: string) => void;
}

export function ChatBubble({ message, onButtonPress, onSuggestionPress }: Props) {
  const { theme } = useTheme();
  const isAgent = message.role === 'agent';

  return (
    <View style={[styles.row, isAgent ? styles.rowAgent : styles.rowUser]}>
      {isAgent && (
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft, borderColor: theme.glassBorder }]}>
          <Text style={styles.avatarText}>🐍</Text>
        </View>
      )}
      <View style={styles.bubbleWrap}>
        {isAgent ? (
          <GlassView radius={20} style={[styles.bubble, { borderColor: theme.bubbleAgentBorder }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bubbleAgent, borderRadius: 20 }]} />
            <Text style={[styles.text, { color: theme.textPrimary }]}>{message.text}</Text>
            {message.buttons && message.buttons.length > 0 && (
              <ContextualButtons buttons={message.buttons} onPress={onButtonPress} />
            )}
            {message.suggestions && message.suggestions.length > 0 && (
              <SuggestionChips suggestions={message.suggestions} onPress={onSuggestionPress} />
            )}
            <View style={styles.footer}>
              <SpeakButton id={message.id} text={message.text} size={28} />
              <Text style={[styles.speakHint, { color: theme.textMuted }]}>Ouvir</Text>
            </View>
          </GlassView>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.userBubble,
              { backgroundColor: theme.bubbleUser, borderColor: theme.bubbleUserBorder },
            ]}
          >
            <Text style={[styles.text, { color: theme.textPrimary }]}>{message.text}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 14, alignItems: 'flex-end' },
  rowAgent: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  avatarText: { fontSize: 17 },
  bubbleWrap: { maxWidth: '82%' },
  bubble: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, overflow: 'hidden' },
  userBubble: { borderTopRightRadius: 6 },
  text: { fontSize: 15.5, lineHeight: 23 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  speakHint: { fontSize: 11.5, fontWeight: '600' },
});
