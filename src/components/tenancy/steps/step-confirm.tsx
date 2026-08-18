import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { PropertyOption } from './step-property';

export interface StepConfirmProps {
  progressBarWidth: any;
  currentPageNumber: number;
  totalPages: number;
  isExistingTenancy: boolean;
  selectedProperty: PropertyOption | null;
  unitDisplay: string;
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  rentAmount: string;
  customFeeAmount: string;
  rentDuration: number;
  onJumpToStep: (stepName: 'property' | 'resident' | 'rent') => void;
}

export function StepConfirm({
  progressBarWidth,
  currentPageNumber,
  totalPages,
  isExistingTenancy,
  selectedProperty,
  unitDisplay,
  residentName,
  residentEmail,
  residentPhone,
  rentAmount,
  customFeeAmount,
  rentDuration,
  onJumpToStep,
}: StepConfirmProps) {
  const numRent = Number(rentAmount.replace(/,/g, '')) || 1270000;
  const adminFee = Math.round(numRent * 0.01);
  const customFeeNum = Number(customFeeAmount.replace(/,/g, '')) || 300000;

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
        <Text style={styles.sectionMainTitle}>Confirm Details</Text>
        <Text style={styles.sectionSubtitle}>
          Confirm all details are correct before generating the tenancy agreement.
        </Text>
      </View>

      {/* Property Details Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Property Details</Text>
          <TouchableOpacity onPress={() => onJumpToStep('property')} activeOpacity={0.7}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Property</Text>
          <Text style={styles.reviewValue}>{selectedProperty?.title || 'Property'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Unit</Text>
          <Text style={styles.reviewValue}>{unitDisplay || 'B1'}</Text>
        </View>
      </View>

      {/* Tenant Profile Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Tenant Profile</Text>
          <TouchableOpacity onPress={() => onJumpToStep('resident')} activeOpacity={0.7}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Name</Text>
          <Text style={styles.reviewValue}>{residentName || 'Saad Bashar'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Email address</Text>
          <Text style={styles.reviewValue}>{residentEmail || 'saadbashar1433@gmail.com'}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Phone Number</Text>
          <Text style={styles.reviewValue}>{residentPhone || '+234 (0) 814 171 4124'}</Text>
        </View>
      </View>

      {/* Payments Card */}
      <View style={styles.reviewSectionCard}>
        <View style={styles.reviewCardHeader}>
          <Text style={styles.reviewHeader}>Payments</Text>
          <TouchableOpacity onPress={() => onJumpToStep('rent')} activeOpacity={0.7}>
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Rent</Text>
          <Text style={styles.reviewValue}>NGN {numRent.toLocaleString()}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Administrative Charge (1%)</Text>
          <Text style={styles.reviewValue}>NGN {adminFee.toLocaleString()}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Deposit Fee</Text>
          <Text style={styles.reviewValue}>NGN {customFeeNum.toLocaleString()}</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Occupiers’ Liability Insurance</Text>
          <Text style={styles.reviewValue}>NGN 5,000</Text>
        </View>

        <View style={styles.reviewItemRow}>
          <Text style={styles.reviewLabel}>Rent Duration (in years)</Text>
          <Text style={styles.reviewValue}>
            {rentDuration || 1} {rentDuration === 1 ? 'year' : 'years'}
          </Text>
        </View>
      </View>

      {/* Bottom Info Banner */}
      <View style={styles.infoBanner}>
        <SymbolView
          name={{ ios: 'info.circle', android: 'info', web: 'info' }}
          size={16}
          tintColor="#D87C24"
        />
        <Text style={styles.infoBannerText}>
          A 1% adminstration charge applies to every new tenancy created and any existing tenancy that is under{' '}
          <Text style={styles.infoBannerBold}>1 month.</Text>
        </Text>
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
    marginBottom: 20,
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
  reviewSectionCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FAF1E4',
    padding: 16,
    marginBottom: 16,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#D87C24',
  },
  editLinkText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  reviewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#6C757D',
  },
  reviewValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    maxWidth: '58%',
    textAlign: 'right',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 17,
  },
  infoBannerBold: {
    fontFamily: 'Satoshi-Bold',
    color: '#1A1C1E',
    fontWeight: '700',
  },
});
