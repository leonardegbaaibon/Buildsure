import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';

export interface PaymentSuccessOverlayProps {
  visible: boolean;
  propertyTitle: string;
  unitIdentifier: string;
  rentAmount: string;
  onGoToMyTenancy: () => void;
}

export function PaymentSuccessOverlay({
  visible,
  propertyTitle,
  unitIdentifier,
  rentAmount,
  onGoToMyTenancy,
}: PaymentSuccessOverlayProps) {
  if (!visible) return null;

  const numRent = Number(rentAmount.replace(/,/g, '')) || 1500000;
  const adminCharge = (numRent * 0.01).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const now = new Date();
  const dateStr = `${now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={styles.paymentSuccessContainer}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} backgroundColor="transparent">
        <ScrollView
          contentContainerStyle={styles.paymentSuccessScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Rosette Badge */}
          <View style={styles.rosetteContainer}>
            <View style={styles.rosetteSparks}>
              <View style={[styles.sparkTick, { transform: [{ rotate: '0deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '45deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '90deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '135deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '180deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '225deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '270deg' }, { translateY: -44 }] }]} />
              <View style={[styles.sparkTick, { transform: [{ rotate: '315deg' }, { translateY: -44 }] }]} />
            </View>

            <View style={styles.rosetteBadge}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={38}
                tintColor="#FFFFFF"
                weight="bold"
              />
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.paymentSuccessTitle}>Payment Successful!</Text>
          <Text style={styles.paymentSuccessSub}>
            Your adminstration charge fee for{' '}
            <Text style={styles.paymentSuccessBoldProp}>
              {propertyTitle} Unit {unitIdentifier}
            </Text>
            {' '}has been confirmed and your tenant's documents has been received.
          </Text>

          {/* Receipt Summary Card */}
          <View style={styles.paymentReceiptCard}>
            <View style={styles.paymentReceiptRow}>
              <Text style={styles.receiptRowLabel}>Status</Text>
              <View style={styles.confirmedPillBadge}>
                <SymbolView
                  name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                  size={14}
                  tintColor="#D87C24"
                />
                <Text style={styles.confirmedPillText}>Confirmed</Text>
              </View>
            </View>

            <View style={styles.paymentReceiptRow}>
              <Text style={styles.receiptRowLabel}>Amount Paid</Text>
              <Text style={styles.receiptAmountVal}>₦{adminCharge}</Text>
            </View>

            <View style={styles.paymentReceiptRow}>
              <Text style={styles.receiptRowLabel}>Date</Text>
              <Text style={styles.receiptDateVal}>{dateStr}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.downloadReceiptOutlineBtn}
            onPress={() =>
              CustomAlert.alert('Receipt Downloaded', 'Your payment receipt has been saved successfully.')
            }
            activeOpacity={0.8}
          >
            <SymbolView
              name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
              size={18}
              tintColor="#D87C24"
            />
            <Text style={styles.downloadReceiptOutlineText}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goToMyTenancyBtn}
            onPress={onGoToMyTenancy}
            activeOpacity={0.8}
          >
            <Text style={styles.goToMyTenancyText}>Go to My Tenancy</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentSuccessContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEFAF4',
    zIndex: 2000,
  },
  paymentSuccessScroll: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  rosetteContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  rosetteSparks: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkTick: {
    position: 'absolute',
    width: 3,
    height: 8,
    backgroundColor: '#B57423',
    borderRadius: 2,
  },
  rosetteBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#B57423',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B57423',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  paymentSuccessTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 10,
  },
  paymentSuccessSub: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 32,
  },
  paymentSuccessBoldProp: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#B57423',
  },
  paymentReceiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 16,
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptRowLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#60646C',
  },
  confirmedPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confirmedPillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#B57423',
  },
  receiptAmountVal: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  receiptDateVal: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#60646C',
  },
  downloadReceiptOutlineBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    backgroundColor: '#FFFDF9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  downloadReceiptOutlineText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#D87C24',
  },
  goToMyTenancyBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goToMyTenancyText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
});
