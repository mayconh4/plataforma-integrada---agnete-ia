import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  suggestions: string[];
  onPress: (text: string) => void;
}

export function SuggestionChips({ suggestions, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.chip, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
          onPress={() => onPress(s)}
        >
          <Text style={[styles.chipText, { color: theme.textSecondary }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  chipText: { fontSize: 12.5, fontWeight: '600' },
});
