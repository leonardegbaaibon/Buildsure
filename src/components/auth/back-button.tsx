import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton} activeOpacity={0.7}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={20}
        tintColor="#1A1C1E"
        weight="bold"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
