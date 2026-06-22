import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  suggestions: string[];
  onPress: (text: string) => void;
}

export function SuggestionChips({ suggestions, onPress }: Props) {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
