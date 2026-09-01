import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

/**
 * Envelope Illustration matching the design for Email Verification
 */
export function EmailIllustration() {
  return (
    <View style={styles.container}>
      {/* Outer Envelope Wrapper */}
      <View style={styles.envelopeBase}>
        {/* Open Top Flap (Behind letter) */}
        <View style={styles.topFlap} />

        {/* Letter coming out */}
        <View style={styles.letterPaper}>
          <View style={styles.letterLineLong} />
          <View style={styles.letterLineShort} />
        </View>

        {/* Front Lower Envelope Body */}
        <View style={styles.envelopeFrontBody} />

        {/* Diagonal Folding Overlay */}
        <View style={styles.leftFold} />
        <View style={styles.rightFold} />
        <View style={styles.bottomFold} />

        {/* Center Accent Badge */}
        <View style={styles.centerBadge}>
          <SymbolView
            name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
            size={22}
            tintColor="#D87C24"
          />
        </View>
      </View>
    </View>
  );
}

export default EmailIllustration;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: 120,
  },
  envelopeBase: {
    width: 130,
    height: 90,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topFlap: {
    position: 'absolute',
    top: -22,
    width: 0,
    height: 0,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#C46A1B',
    zIndex: 1,
  },
  letterPaper: {
    position: 'absolute',
    top: -15,
    width: 96,
    height: 56,
    backgroundColor: '#FFE9D2',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F5C99B',
    padding: 10,
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  letterLineLong: {
    height: 5,
    backgroundColor: '#D87C24',
    borderRadius: 3,
    width: '75%',
    marginBottom: 6,
    opacity: 0.7,
  },
  letterLineShort: {
    height: 5,
    backgroundColor: '#D87C24',
    borderRadius: 3,
    width: '45%',
    opacity: 0.5,
  },
  envelopeFrontBody: {
    position: 'absolute',
    bottom: 0,
    width: 124,
    height: 72,
    backgroundColor: '#E68A2E',
    borderRadius: 12,
    zIndex: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  leftFold: {
    position: 'absolute',
    bottom: 0,
    left: 3,
    width: 0,
    height: 0,
    borderTopWidth: 36,
    borderBottomWidth: 36,
    borderLeftWidth: 58,
    borderTopColor: 'transparent',
    borderBottomColor: '#D87C24',
    borderLeftColor: '#DB832B',
    borderRadius: 8,
    zIndex: 4,
  },
  rightFold: {
    position: 'absolute',
    bottom: 0,
    right: 3,
    width: 0,
    height: 0,
    borderTopWidth: 36,
    borderBottomWidth: 36,
    borderRightWidth: 58,
    borderTopColor: 'transparent',
    borderBottomColor: '#D87C24',
    borderRightColor: '#DB832B',
    borderRadius: 8,
    zIndex: 4,
  },
  bottomFold: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 62,
    borderRightWidth: 62,
    borderBottomWidth: 42,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#CC741E',
    borderRadius: 10,
    zIndex: 5,
  },
  centerBadge: {
    position: 'absolute',
    top: 36,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
