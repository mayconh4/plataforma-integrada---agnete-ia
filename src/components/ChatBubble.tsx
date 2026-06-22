import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChatMessage } from '../types/chat';
import { ContextualButtons } from './ContextualButtons';
import { SuggestionChips } from './SuggestionChips';
import { colors } from '../theme/colors';

interface Props {
  message: ChatMessage;
  onButtonPress: (action: string, label: string) => void;
  onSuggestionPress: (text: string) => void;
}

export function ChatBubble({ message, onButtonPress, onSuggestionPress }: Props) {
  const isHermes = message.role === 'hermes';

  return (
    <View style={[styles.row, isHermes ? styles.rowHermes : styles.rowUser]}>
      {isHermes && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>⚡</Text>
        </View>
      )}
      <View style={[styles.bubbleContainer, isHermes ? styles.hermesBubble : styles.userBubble]}>
        <BlurView intensity={20} tint="dark" style={styles.blur}>
          <Text style={[styles.text, isHermes ? styles.hermesText : styles.userText]}>
            {message.text}
          </Text>
          {isHermes && message.buttons && message.buttons.length > 0 && (
            <ContextualButtons buttons={message.buttons} onPress={onButtonPress} />
          )}
          {isHermes && message.suggestions && message.suggestions.length > 0 && (
            <SuggestionChips suggestions={message.suggestions} onPress={onSuggestionPress} />
          )}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  rowHermes: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 16,
  },
  bubbleContainer: {
    maxWidth: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hermesBubble: {
    borderColor: 'rgba(108, 99, 255, 0.2)',
    backgroundColor: colors.hermesBubble,
  },
  userBubble: {
    borderColor: 'rgba(0, 212, 170, 0.2)',
    backgroundColor: colors.userBubble,
  },
  blur: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  hermesText: {
    color: colors.textPrimary,
  },
  userText: {
    color: colors.textPrimary,
  },
});
