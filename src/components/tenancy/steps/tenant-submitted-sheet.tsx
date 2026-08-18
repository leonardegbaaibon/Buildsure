import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface TenantSubmittedSheetProps {
  visible: boolean;
  isExistingTenancy: boolean;
  onGoToDashboard: () => void;
  onCreateAnother: () => void;
}

export function TenantSubmittedSheet({
  visible,
  isExistingTenancy,
  onGoToDashboard,
  onCreateAnother,
}: TenantSubmittedSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.successModalOverlay}>
      <TouchableOpacity
        style={styles.successModalDismiss}
        activeOpacity={1}
        onPress={onGoToDashboard}
      />
      <View style={styles.successSheetContainer}>
        {/* Drag Indicator */}
        <View style={styles.dragIndicator} />

        {/* Success Badge Row */}
        <View style={styles.successBadgeRow}>
          <View style={styles.dashedBorderCircle}>
            <View style={styles.successIconCircle}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={20}
                tintColor="#FFFFFF"
                weight="bold"
              />
            </View>
          </View>
        </View>

        {/* Text Section */}
        <Text style={styles.successTitle}>
          {isExistingTenancy ? 'Tenancy Recorded!' : 'Tenant Submitted!'}
        </Text>
        <Text style={styles.successDescription}>
          {isExistingTenancy
            ? 'Your tenancy documents have been recorded successfully. We will notify you once approved.'
            : "The tenant's documents are now being reviewed by our administrators. We will notify you once verified."}
        </Text>

        {/* Stacked Pill Buttons */}
        <TouchableOpacity
          style={styles.successGoDashboardBtn}
          onPress={onGoToDashboard}
          activeOpacity={0.8}
        >
          <Text style={styles.successGoDashboardText}>Go to dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.successCreateAnotherBtn}
          onPress={onCreateAnother}
          activeOpacity={0.8}
        >
          <Text style={styles.successCreateAnotherText}>Create another tenancy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  successModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1500,
  },
  successModalDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
    zIndex: 1600,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  successBadgeRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dashedBorderCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  successDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  successGoDashboardBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successGoDashboardText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  successCreateAnotherBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCreateAnotherText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
  },
});
