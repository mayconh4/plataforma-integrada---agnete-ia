import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubble } from '../components/ChatBubble';
import { VoiceToggle } from '../components/VoiceToggle';
import { ChatMessage } from '../types/chat';
import { useHermes } from '../backend/useHermes';
import { pressButton, pressSuggestion, sendMessage } from '../backend/store';
import { speak } from '../services/voiceService';
import { colors } from '../theme/colors';

export function ChatScreen() {
  const { conversation } = useHermes();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const lastSpokenId = useRef<string | null>(null);

  // Narra a última mensagem do Hermes quando ela muda.
  useEffect(() => {
    const last = conversation[conversation.length - 1];
    if (last && last.role === 'hermes' && last.narrate && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id;
      speak(last.text);
    }
    if (conversation.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [conversation]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>⚡</Text>
              <View>
                <Text style={styles.headerTitle}>Hermes</Text>
                <Text style={styles.headerSubtitle}>Assistente Operacional</Text>
              </View>
            </View>
            <VoiceToggle />
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={conversation}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onButtonPress={pressButton}
                onSuggestionPress={pressSuggestion}
              />
            )}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input */}
          <View style={styles.inputBar}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite algo ou toque nos botões..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 12,
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
