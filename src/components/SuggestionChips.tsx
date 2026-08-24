import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { mono } from '../theme/typography';

interface Props {
  suggestions: string[];
  onPress: (text: string) => void;
}

export function SuggestionChips({ suggestions, onPress }: Props) {
  return (
    <View style={styles.container}>
      {suggestions.map((s, i) => (
        <TouchableOpacity key={i} style={styles.chip} onPress={() => onPress(s)} activeOpacity={0.6}>
          <Text style={styles.chipText}>{'// '}{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  chip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    // sharp corners — no borderRadius
  },
  chipText: {
    fontFamily: mono,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
