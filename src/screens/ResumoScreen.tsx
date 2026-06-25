import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/AppStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatCard } from '../components/StatCard';
import { TabKey } from '../components/TabBar';

export function ResumoScreen({ go }: { go: (key: TabKey) => void }) {
  const { theme } = useTheme();
  const { data, metrics } = useStore();

  return (
    <ScreenContainer title="Resumo" subtitle="Seu painel operacional">
      <View style={styles.grid}>
        <StatCard
          icon="📋"
          value={metrics.pendingTasks}
          label="Tarefas pendentes"
          color={theme.primary}
          onPress={() => go('tarefas')}
          style={styles.cell}
        />
        <StatCard
          icon="✅"
          value={metrics.completedTasks}
          label="Concluídas"
          color={theme.success}
          onPress={() => go('tarefas')}
          style={styles.cell}
        />
        <StatCard
          icon="🤖"
          value={metrics.activeAgents}
          label="Agentes ativos"
          color={theme.accent}
          onPress={() => go('projetos')}
          style={styles.cell}
        />
        <StatCard
          icon="💬"
          value={data.messageCount}
          label="Mensagens com a Viper"
          onPress={() => go('chat')}
          style={styles.cell}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 4 },
  cell: { flexGrow: 1, flexBasis: '46%' },
});
