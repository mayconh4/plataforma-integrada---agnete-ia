import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassButton } from './glass/GlassButton';
import { ContextButton } from '../types/chat';

interface Props {
  buttons: ContextButton[];
  onPress: (action: string) => void;
}

export function ContextualButtons({ buttons, onPress }: Props) {
  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <GlassButton
          key={btn.id}
          label={btn.label}
          icon={btn.icon}
          variant={btn.variant ?? 'secondary'}
          onPress={() => onPress(btn.action)}
          style={styles.btn}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { marginBottom: 0 },
});
