import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

export function PhoneIllustration() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/phone_verify_icon.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  image: {
    width: 156,
    height: 156,
  },
});
