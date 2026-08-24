import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../types/chat';
import { ContextualButtons } from './ContextualButtons';
import { SuggestionChips } from './SuggestionChips';
import { colors } from '../theme/colors';
import { mono } from '../theme/typography';

interface Props {
  message: ChatMessage;
  onButtonPress: (action: string) => void;
  onSuggestionPress: (text: string) => void;
}

export function ChatBubble({ message, onButtonPress, onSuggestionPress }: Props) {
  const isHermes = message.role === 'hermes';
  const label = isHermes ? 'HERMES' : 'VOCÊ';
  const labelColor = isHermes ? colors.accent : colors.primary;
  const prompt = isHermes ? 'PS>' : '>';

  return (
    <View style={styles.row}>
      <View style={[styles.headerLine]}>
        <View style={[styles.tag, { borderColor: labelColor }]}>
          <Text style={[styles.tagText, { color: labelColor }]}>{label}</Text>
        </View>
      </View>
      <View style={[styles.block, { borderLeftColor: labelColor }]}>
        <Text style={styles.text}>
          <Text style={[styles.prompt, { color: labelColor }]}>{prompt} </Text>
          {message.text}
        </Text>
        {isHermes && message.buttons && message.buttons.length > 0 && (
          <ContextualButtons buttons={message.buttons} onPress={onButtonPress} />
        )}
        {isHermes && message.suggestions && message.suggestions.length > 0 && (
          <SuggestionChips suggestions={message.suggestions} onPress={onSuggestionPress} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  headerLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    // sharp corners — no borderRadius
  },
  tagText: {
    fontFamily: mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  block: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    fontFamily: mono,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  prompt: {
    fontFamily: mono,
    fontWeight: '700',
  },
});
