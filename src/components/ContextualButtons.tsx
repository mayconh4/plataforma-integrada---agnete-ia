import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LiquidGlassButton } from './LiquidGlassButton';
import { ContextButton } from '../types/chat';

interface Props {
  buttons: ContextButton[];
  onPress: (action: string, label: string) => void;
}

export function ContextualButtons({ buttons, onPress }: Props) {
  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <LiquidGlassButton key={btn.id} button={btn} onPress={onPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
  },
});
