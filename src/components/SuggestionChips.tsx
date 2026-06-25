import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/colors';

interface Props {
  suggestions: string[];
  onPress: (text: string) => void;
}

export function SuggestionChips({ suggestions, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {suggestions.map((s, i) => (
        <TouchableOpacity key={i} style={styles.chip} onPress={() => onPress(s)}>
          <Text style={styles.chipText}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 6 },
    chip: { backgroundColor: colors.glassBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: colors.glassBorder },
    chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  });
