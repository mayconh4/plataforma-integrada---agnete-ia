import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import { TabBar, TabKey } from '../navigation/TabBar';
import { VoiceScreen } from './VoiceScreen';
import { TasksScreen } from './TasksScreen';
import { MetricsScreen } from './MetricsScreen';
import { ProjectsScreen } from './ProjectsScreen';
import { GoalsScreen } from './GoalsScreen';
import { ProjectDetailScreen } from './ProjectDetailScreen';
import { ProjectEditScreen } from './ProjectEditScreen';
import { sendMessage } from '../backend/store';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

export function MainScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<TabKey>('viper');
  const [kbVisible, setKbVisible] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

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

  const overlay = detailId !== null || editId !== null;

  return (
    <View style={styles.root}>
      {editId ? (
        <ProjectEditScreen projectId={editId} onClose={() => setEditId(null)} />
      ) : detailId ? (
        <ProjectDetailScreen projectId={detailId} onBack={() => setDetailId(null)} onEdit={() => setEditId(detailId)} />
      ) : (
        <>
          {tab === 'viper' && <VoiceScreen kbVisible={kbVisible} />}
          {tab === 'resumo' && <MetricsScreen />}
          {tab === 'tarefas' && <TasksScreen />}
          {tab === 'projetos' && <ProjectsScreen onOpen={setDetailId} onEditProject={setEditId} />}
          {tab === 'metas' && <GoalsScreen onAskViper={goChatWith} />}
        </>
      )}

      {/* A barra some quando o teclado está aberto ou em um overlay (detalhe/edição). */}
      {!kbVisible && !overlay && <TabBar active={tab} onChange={setTab} />}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
  });
