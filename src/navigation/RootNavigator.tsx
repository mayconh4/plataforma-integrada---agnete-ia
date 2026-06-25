import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useSpeech } from '../hooks/useSpeech';
import { TabBar, TabKey } from '../components/TabBar';
import { ChatScreen } from '../screens/ChatScreen';
import { ResumoScreen } from '../screens/ResumoScreen';
import { TarefasScreen } from '../screens/TarefasScreen';
import { ProjetosScreen } from '../screens/ProjetosScreen';
import { MetasScreen } from '../screens/MetasScreen';
import { ProjetoDetailScreen } from '../screens/ProjetoDetailScreen';
import { ContaScreen } from '../screens/ContaScreen';

export function RootNavigator() {
  const { theme } = useTheme();
  const { activeId } = useSpeech();
  const [tab, setTab] = useState<TabKey>('chat');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const go = (next: TabKey) => {
    setDetailId(null);
    setShowSettings(false);
    setTab(next);
  };

  const overlay = detailId !== null || showSettings;

  const renderTab = () => {
    switch (tab) {
      case 'resumo':
        return <ResumoScreen go={go} />;
      case 'tarefas':
        return <TarefasScreen />;
      case 'projetos':
        return <ProjetosScreen onOpen={(id) => setDetailId(id)} />;
      case 'metas':
        return <MetasScreen />;
      case 'chat':
      default:
        return <ChatScreen go={go} onOpenSettings={() => setShowSettings(true)} />;
    }
  };

  return (
    <View style={styles.flex}>
      <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />
      <StatusBar style={theme.name === 'light' ? 'dark' : 'light'} />

      <View style={styles.flex}>
        {showSettings ? (
          <ContaScreen onBack={() => setShowSettings(false)} />
        ) : detailId ? (
          <ProjetoDetailScreen projectId={detailId} onBack={() => setDetailId(null)} />
        ) : (
          renderTab()
        )}
      </View>

      {!overlay && <TabBar active={tab} onChange={go} listening={activeId !== null} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
