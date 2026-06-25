import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { ChatHeader } from '../components/ChatHeader';
import { ChatBubble } from '../components/ChatBubble';
import { ChatMessage } from '../types/chat';
import { processUserInput, getWelcomeMessage, replyForAction } from '../services/viperEngine';
import { narrate } from '../services/voiceService';
import { TAB_BAR_SPACE } from '../components/ScreenContainer';
import { TabKey } from '../components/TabBar';

interface Props {
  go: (key: TabKey) => void;
  onOpenSettings: () => void;
}

const NAV_ACTIONS: Record<string, TabKey> = {
  open_resumo: 'resumo',
  open_tarefas: 'tarefas',
  open_projetos: 'projetos',
  open_metas: 'metas',
};

export function ChatScreen({ go, onOpenSettings }: Props) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { data, bumpMessageCount } = useStore();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getWelcomeMessage(data.settings.userName)]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const pushAgent = useCallback(
    (agentMsg: ChatMessage) => {
      setMessages((prev) => [...prev, agentMsg]);
      if (data.settings.voiceEnabled && data.settings.autoNarrate && agentMsg.narrate) {
        narrate(agentMsg.id, agentMsg.text);
      }
      bumpMessageCount(1);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    },
    [data.settings, bumpMessageCount]
  );

  const sendUser = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = { id: `user_${Date.now()}`, role: 'user', text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      bumpMessageCount(1);
      const reply = processUserInput(text, { history: messages });
      setTimeout(() => pushAgent(reply), 220);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    },
    [messages, pushAgent, bumpMessageCount]
  );

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendUser(text);
  };

  const handleAction = (action: string) => {
    if (action === 'open_conta') return onOpenSettings();
    if (action === 'toggle_theme') return toggleTheme();
    const tab = NAV_ACTIONS[action];
    if (tab) return go(tab);
    pushAgent(replyForAction(action));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ChatHeader onSettings={onOpenSettings} />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} onButtonPress={handleAction} onSuggestionPress={sendUser} />
        )}
        style={styles.flex}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={[styles.inputBar, { marginBottom: TAB_BAR_SPACE + insets.bottom - 16 }]}>
        <View style={[styles.inputContainer, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
          <TextInput
            style={[styles.input, { color: theme.textPrimary }]}
            placeholder="Fale ou digite para a Viper..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            style={[styles.send, { backgroundColor: inputText.trim() ? theme.primary : theme.glass }]}
            disabled={!inputText.trim()}
          >
            <Text style={[styles.sendIcon, { color: inputText.trim() ? theme.textOnAccent : theme.textMuted }]}>↑</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputBar: { paddingHorizontal: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 5,
  },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 13 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 19, fontWeight: '800' },
});
