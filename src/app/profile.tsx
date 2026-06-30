import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { getUserName } from '@/utils/user-store';

export default function ProfileScreen() {
  const name = getUserName() || 'Saad Bashar';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Profile settings and configurations.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,

  },
});
