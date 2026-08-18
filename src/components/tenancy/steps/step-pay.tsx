import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

export interface StepPayProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  rentAmount: string;
}

export function StepPay({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  rentAmount,
}: StepPayProps) {
  const numRent = Number(rentAmount.replace(/,/g, '')) || 1500000;
  const adminFee = Math.round(numRent * 0.01);

  return (
    <View style={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.progressText}>
          Page {currentPageNumber} of {totalPages}
        </Text>
      </View>

      {/* Title & Subtitle */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionMainTitle}>Pay Administration Charge</Text>
        <Text style={styles.sectionSubtitle}>
          Pay the administration charge of this tenancy to have premium access.
        </Text>
      </View>

      {/* Payment Summary Box */}
      <View style={styles.paySummaryCard}>
        <Text style={styles.paySummaryHeader}>Payment Summary</Text>

        <View style={styles.paySummaryRow}>
          <Text style={styles.paySummaryLabel}>Tenancy Value</Text>
          <Text style={styles.paySummaryVal}>
            ₦{numRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.dividerLine} />

        <View style={styles.paySummaryRow}>
          <View style={styles.labelWithIcon}>
            <Text style={styles.paySummaryLabel}>Administrative Fee (1%)</Text>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info', web: 'info' }}
              size={15}
              tintColor="#8A8D93"
            />
          </View>
          <Text style={styles.paySummaryVal}>
            ₦{adminFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#EBE6DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#8A8D93',
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionMainTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  paySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 18,
    marginBottom: 24,
  },
  paySummaryHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#D87C24',
    marginBottom: 16,
  },
  paySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 12,
  },
  paySummaryLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#4A4D54',
  },
  paySummaryVal: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
});
