import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import { TabBar, TabKey } from '../navigation/TabBar';
import { VoiceScreen } from './VoiceScreen';
import { TasksScreen } from './TasksScreen';
import { MetricsScreen } from './MetricsScreen';
import { ProjectsScreen } from './ProjectsScreen';
import { GoalsScreen } from './GoalsScreen';
import { openProject, sendMessage } from '../backend/store';
import { colors } from '../theme/colors';

export function MainScreen() {
  const [tab, setTab] = useState<TabKey>('viper');
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, () => setKbVisible(true));
    const h = Keyboard.addListener(hideEvt, () => setKbVisible(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const goChatWith = (text: string) => {
    setTab('viper');
    sendMessage(text);
  };

  const handleOpenProject = (name: string) => {
    openProject(name);
    setTab('viper');
    sendMessage(`Abrir projeto: ${name}`);
  };

  return (
    <View style={styles.root}>
      {tab === 'viper' && <VoiceScreen kbVisible={kbVisible} />}
      {tab === 'resumo' && <MetricsScreen />}
      {tab === 'tarefas' && <TasksScreen />}
      {tab === 'projetos' && <ProjectsScreen onOpenProject={handleOpenProject} />}
      {tab === 'metas' && <GoalsScreen onAskViper={goChatWith} />}

      {/* A barra some quando o teclado está aberto (libera o campo de digitação) */}
      {!kbVisible && <TabBar active={tab} onChange={setTab} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
