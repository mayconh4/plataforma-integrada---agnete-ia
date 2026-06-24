import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/Glass';
import { TOP_INSET, TAB_BAR_SPACE } from '../components/ScreenShell';
import { colors } from '../theme/colors';

interface Project {
  name: string;
  icon: string;
  desc: string;
}

const PROJECTS: Project[] = [
  { name: 'Perfection Airsoft', icon: '🎯', desc: 'Loja e operação de airsoft' },
  { name: 'App Barber', icon: '💈', desc: 'Agendamento para barbearias' },
  { name: 'App Beleza', icon: '💅', desc: 'Plataforma de beleza' },
];

export function ProjectsScreen({ onOpenProject }: { onOpenProject: (name: string) => void }) {
  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.g}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Projetos</Text>
        <Text style={styles.subtitle}>Toque para abrir o projeto na conversa com a Viper</Text>

        {PROJECTS.map((p) => (
          <TouchableOpacity key={p.name} activeOpacity={0.85} onPress={() => onOpenProject(p.name)}>
            <GlassCard style={styles.card}>
              <Text style={styles.icon}>{p.icon}</Text>
              <View style={styles.body}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.desc}>{p.desc}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  g: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: TOP_INSET + 18, paddingBottom: TAB_BAR_SPACE },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 12 },
  icon: { fontSize: 26 },
  body: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  desc: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  arrow: { color: colors.textSecondary, fontSize: 26, fontWeight: '300' },
});
