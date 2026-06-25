import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

/** Vertical space the floating tab bar occupies; screens pad their content by this. */
export const TAB_BAR_SPACE = 104;

interface Props {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  onAdd?: () => void;
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared screen shell: respects the safe-area top inset, renders a large screen
 * title + optional "+" action, and pads content so the floating glass tab bar
 * never overlaps it. The app gradient lives behind it (in the navigator).
 */
export function ScreenContainer({ title, subtitle, children, scroll = true, onAdd, headerRight, contentStyle }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const header =
    title || onAdd || headerRight ? (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerText}>
          {title ? <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {headerRight}
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            style={[styles.add, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
            hitSlop={8}
          >
            <Text style={[styles.addIcon, { color: theme.primary }]}>＋</Text>
          </Pressable>
        ) : null}
      </View>
    ) : (
      <View style={{ height: insets.top }} />
    );

  const padded = [styles.body, { paddingBottom: TAB_BAR_SPACE + insets.bottom }, contentStyle];

  if (!scroll) {
    return (
      <View style={styles.flex}>
        {header}
        <View style={[styles.flex, padded]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {header}
      <ScrollView
        contentContainerStyle={padded}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 22, paddingBottom: 14, gap: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2, fontWeight: '500' },
  add: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, fontWeight: '600', marginTop: -2 },
  body: { paddingHorizontal: 18 },
});
