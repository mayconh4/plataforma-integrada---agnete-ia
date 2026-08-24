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
import { ChatBubble } from '../components/ChatBubble';
import { VoiceToggle } from '../components/VoiceToggle';
import { ChatMessage, ConversationContext } from '../types/chat';
import { processUserInput, processButtonAction, getWelcomeMessage } from '../services/hermesEngine';
import { speak } from '../services/voiceService';
import { startWakeWord, stopWakeWord } from '../services/wakeWordService';
import { startListening, stopListening } from '../services/speechInput';
import { isWakeWordConfigured, WAKE_WORD } from '../config/wakeWord';
import { colors } from '../theme/colors';
import { mono } from '../theme/typography';

type VoiceStatus = 'off' | 'waiting' | 'listening';

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [inputText, setInputText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('off');
  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'hermes' && last.narrate) {
      speak(last.text);
    }
  }, [messages]);

  const addMessages = (userMsg: ChatMessage, hermesMsg: ChatMessage) => {
    setMessages((prev) => [...prev, userMsg, hermesMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Shared entry point: typed text, suggestions, and voice all route here.
  const submitUserText = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    const context: ConversationContext = { history: [...messagesRef.current, userMsg] };
    addMessages(userMsg, processUserInput(text, context));
  };

  // Wake word "continental": listen for it, and on detection capture one
  // spoken command, answer it, then resume waiting for the wake word.
  const beginListening = () => {
    setVoiceStatus('listening');
    startListening({
      onPartial: (t) => setInputText(t),
      onResult: (t) => {
        setInputText('');
        submitUserText(t);
      },
      onEnd: () => setVoiceStatus(isWakeWordConfigured() ? 'waiting' : 'off'),
      onError: () => setVoiceStatus(isWakeWordConfigured() ? 'waiting' : 'off'),
    });
  };

  useEffect(() => {
    if (!isWakeWordConfigured()) return;
    let mounted = true;
    startWakeWord({
      onWake: () => {
        if (!mounted) return;
        stopListening();
        beginListening();
      },
      onError: () => setVoiceStatus('off'),
    }).then((ok) => {
      if (mounted && ok) setVoiceStatus('waiting');
    });
    return () => {
      mounted = false;
      stopWakeWord();
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const text = inputText;
    setInputText('');
    submitUserText(text);
  };

  const handleButtonPress = (action: string) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: `[${action}]`,
      timestamp: Date.now(),
    };
    const context: ConversationContext = { history: [...messagesRef.current, userMsg] };
    addMessages(userMsg, processButtonAction(action, context));
  };

  const handleSuggestionPress = (text: string) => submitUserText(text);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>PS</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>HERMES</Text>
                <Text style={styles.headerSubtitle}>
                  {voiceStatus === 'listening'
                    ? '● ouvindo...'
                    : voiceStatus === 'waiting'
                      ? `aguardando "${WAKE_WORD}"`
                      : 'console operacional'}
                </Text>
              </View>
            </View>
            <VoiceToggle />
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onButtonPress={handleButtonPress}
                onSuggestionPress={handleSuggestionPress}
              />
            )}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input */}
          <View style={styles.inputBar}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrompt}>{'>'}</Text>
              <TextInput
                style={styles.input}
                placeholder={voiceStatus === 'listening' ? 'ouvindo sua voz...' : 'digite um comando...'}
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
                <Text style={[styles.sendIcon, inputText.trim() ? styles.sendIconActive : null]}>
                  ENTER
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // sharp corners
  },
  logoText: {
    fontFamily: mono,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: mono,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: mono,
    color: colors.textMuted,
    fontSize: 10,
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 10,
    gap: 8,
    // sharp corners
  },
  inputPrompt: {
    fontFamily: mono,
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontFamily: mono,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 11,
  },
  sendButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.surfaceRaised,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendIcon: {
    fontFamily: mono,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sendIconActive: {
    color: colors.background,
  },
});
