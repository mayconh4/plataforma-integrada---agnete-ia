import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

export const TOP_INSET = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 44;
// espaço para a barra de abas não cobrir o conteúdo
export const TAB_BAR_SPACE = 108;

/** Casca padrão das telas: gradiente + cabeçalho + área rolável. */
export function ScreenShell({
  title,
  subtitle,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <LinearGradient colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]} style={styles.gradient}>
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>
          {header}
          {children}
        </View>
      )}
    </LinearGradient>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    gradient: { flex: 1 },
    flex: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: TOP_INSET + 18, paddingBottom: TAB_BAR_SPACE },
    header: { marginBottom: 18 },
    title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  });
