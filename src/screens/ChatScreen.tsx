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
import { pressSuggestion, sendMessage, signOut } from '../backend/store';
import { speak } from '../services/voiceService';
import { colors } from '../theme/colors';

export function ChatScreen() {
  const { messages, sending } = useHermes();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const lastSpokenId = useRef<string | null>(null);

  // Narra a última mensagem do Hermes quando ela muda.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'hermes' && last.narrate && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id;
      speak(last.text);
    }
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    void sendMessage(text);
  };

  const onButtonPress = (_action: string, label: string) => {
    void sendMessage(label);
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
                <Text style={styles.headerSubtitle}>{sending ? 'digitando…' : 'Online'}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <VoiceToggle />
              <TouchableOpacity onPress={() => void signOut()} style={styles.signOut}>
                <Text style={styles.signOutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onButtonPress={onButtonPress}
                onSuggestionPress={pressSuggestion}
              />
            )}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              sending ? (
                <View style={styles.typing}>
                  <Text style={styles.typingText}>Hermes está digitando…</Text>
                </View>
              ) : null
            }
          />

          {/* Input */}
          <View style={styles.inputBar}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Pergunte ou peça algo ao Hermes..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!sending}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
                disabled={!inputText.trim() || sending}
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
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 28 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  signOut: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  signOutText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: 12 },
  typing: { paddingHorizontal: 24, paddingVertical: 8 },
  typingText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },
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
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 12 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: { backgroundColor: colors.primary },
  sendIcon: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
});
