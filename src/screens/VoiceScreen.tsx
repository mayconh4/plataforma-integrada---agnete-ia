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
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubble } from '../components/ChatBubble';
import { VoiceToggle } from '../components/VoiceToggle';
import { ChatMessage } from '../types/chat';
import { useHermes } from '../backend/useHermes';
import { closeProject, openProject, pressSuggestion, sendMessage, setServerUrl, setVoice, signOut } from '../backend/store';
import { speak } from '../services/voiceService';
import { useVoiceInput } from '../services/speech';
import { VOICE_OPTIONS } from '../lib/voicePref';
import { TOP_INSET } from '../components/ScreenShell';
import { colors } from '../theme/colors';

const statusLabel: Record<string, string> = {
  idle: 'Conectando…',
  connecting: 'Conectando…',
  online: 'Online',
  offline: 'Offline',
};

const QUICK_REPLIES = ['Ver minhas tarefas', 'Resumo do dia', 'Status do sistema', 'Criar uma tarefa'];

export function VoiceScreen({ kbVisible }: { kbVisible: boolean }) {
  const { messages, thinking, status, activeProject, wsUrl, voice } = useHermes();
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [serverInput, setServerInput] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const lastSpokenId = useRef<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const openSettings = () => {
    setServerInput(wsUrl);
    setShowSettings(true);
  };
  const saveServer = () => {
    void setServerUrl(serverInput);
    setShowSettings(false);
  };
  const chooseVoice = async (id: string) => {
    await setVoice(id);
    speak('Olá Maycon, essa é a minha voz.');
  };

  const { listening, partial, start, stop } = useVoiceInput((t) => sendMessage(t));

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'hermes' && last.narrate && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id;
      speak(last.text);
    }
    if (messages.length) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [listening, pulse]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
  };

  const onButtonPress = (_action: string, label: string) => {
    const m = label.match(/^abrir projeto:\s*(.+)$/i);
    if (m) {
      openProject(m[1].trim());
      return;
    }
    sendMessage(label);
  };

  const toggleMic = () => {
    if (listening) stop();
    else void start();
  };

  const isEmpty = messages.length === 0;
  const statusColor = status === 'online' ? colors.accent : status === 'offline' ? colors.danger : '#F5A623';

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: TOP_INSET + 12 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🐍</Text>
            <View>
              <Text style={styles.headerTitle}>Viper</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.headerSubtitle}>{thinking ? 'pensando…' : statusLabel[status] ?? 'Online'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <VoiceToggle />
            <TouchableOpacity onPress={openSettings} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⚙</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void signOut()} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {status === 'offline' ? (
          <TouchableOpacity onPress={openSettings} style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              {wsUrl ? 'Viper offline — toque para conferir o servidor' : 'Toque para configurar o servidor da Viper'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {activeProject ? (
          <View style={styles.projectBanner}>
            <Text style={styles.projectText}>📂 Projeto: {activeProject}</Text>
            <TouchableOpacity onPress={closeProject}>
              <Text style={styles.projectClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isEmpty ? (
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Bom te ver.</Text>
            <Text style={styles.heroPrompt}>O que temos para hoje?</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble message={item} onButtonPress={onButtonPress} onSuggestionPress={pressSuggestion} />
            )}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={thinking ? <Text style={styles.typing}>Viper está pensando…</Text> : null}
          />
        )}

        {/* Respostas rápidas (sem precisar digitar) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickRow}
          contentContainerStyle={styles.quickContent}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}>
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Barra de entrada */}
        <View style={[styles.inputBar, { marginBottom: kbVisible ? 8 : 92 }]}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity onPress={toggleMic} style={[styles.mic, listening && styles.micActive]} activeOpacity={0.8}>
              <Text style={styles.micIcon}>{listening ? '■' : '🎙️'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={listening ? 'Ouvindo…' : 'Fale ou digite para a Viper...'}
              placeholderTextColor={colors.textMuted}
              value={listening ? partial : inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!listening}
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

        {/* Modal: configurações (voz + servidor) */}
        <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Configurações</Text>

              <Text style={styles.modalSection}>Voz da Viper</Text>
              <Text style={styles.modalHint}>Toque para ouvir uma prévia e definir a voz.</Text>
              <View style={styles.voiceGrid}>
                {VOICE_OPTIONS.map((v) => {
                  const selected = v.id === voice;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => void chooseVoice(v.id)}
                      style={[styles.voiceChip, selected && styles.voiceChipActive]}
                    >
                      <Text style={[styles.voiceChipText, selected && styles.voiceChipTextActive]}>
                        {v.gender === 'f' ? '♀' : '♂'} {v.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalSection}>Servidor da Viper</Text>
              <Text style={styles.modalHint}>URL WebSocket do túnel, terminando em /ws.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="wss://...ngrok-free.dev/ws"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={serverInput}
                onChangeText={setServerInput}
              />
              <View style={styles.modalRow}>
                <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.modalBtnGhost}>
                  <Text style={styles.modalBtnGhostText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveServer} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Salvar e conectar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 26 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  iconBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  offlineBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,92,114,0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  offlineText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  projectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  projectText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  projectClose: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  heroTitle: { color: colors.textMuted, fontSize: 16, marginBottom: 6 },
  heroPrompt: { color: colors.textPrimary, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: 12 },
  typing: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', paddingHorizontal: 24, paddingVertical: 8 },
  quickRow: { maxHeight: 46, flexGrow: 0 },
  quickContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  quickChip: {
    backgroundColor: colors.glassBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quickChipText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  mic: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  micActive: { backgroundColor: colors.danger },
  micIcon: { fontSize: 22 },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 12 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  sendButtonActive: { backgroundColor: colors.primary },
  sendIcon: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalSection: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  modalHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  voiceChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.04)' },
  voiceChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  voiceChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  voiceChipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: colors.textPrimary, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnGhost: { paddingHorizontal: 14, paddingVertical: 10 },
  modalBtnGhostText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  modalBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
});
