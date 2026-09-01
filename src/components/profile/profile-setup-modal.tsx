import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '../auth/back-button';
import { AppScreen } from '@/components/ui/app-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfileCompletion, fetchUserProfile } from '@/store/slices/auth-slice';
import BankAccountModal from './bank-account-modal';
import VerifyEmailModal from './verify-email-modal';
import { setActiveTab, setShouldStartAddProperty } from '@/utils/user-store';

interface ProfileSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTenancy?: () => void;
}

export default function ProfileSetupModal({
  visible,
  onClose,
  onCreateTenancy,
}: ProfileSetupModalProps) {
  const dispatch = useAppDispatch();
  const completion = useAppSelector((state) => state.auth.completion);
  const profile = useAppSelector((state) => state.auth.profile);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isVerifyEmailVisible, setIsVerifyEmailVisible] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState('Email Address Verified');

  useEffect(() => {
    if (visible) {
      dispatch(fetchProfileCompletion());
      dispatch(fetchUserProfile());
    }
  }, [visible, dispatch]);

  const handleEmailVerified = () => {
    setToastMessage('Email Address Verified');
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 3500);
  };

  const steps = [
    {
      key: 'verify_email',
      title: 'Verify your Email Address',
      subtitle: 'Enter your email and verify with an OTP.',
      icon: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
      isDone: profile?.isEmailVerified || completion?.steps.find((s) => s.key === 'verify_email')?.done || false,
      onPress: () => {
        setIsVerifyEmailVisible(true);
      },
    },
    {
      key: 'add_property',
      title: 'Add your First Property',
      subtitle: 'Add your first property under a minute.',
      icon: { ios: 'house.fill', android: 'home', web: 'home' },
      isDone: completion?.steps.find((s) => s.key === 'add_property')?.done || false,
      onPress: () => {
        onClose();
        setShouldStartAddProperty(true);
        setActiveTab('properties');
      },
    },
    {
      key: 'create_tenancy',
      title: 'Create your First Tenancy',
      subtitle: 'Onboard your first tenant to see insights.',
      icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
      isDone: completion?.steps.find((s) => s.key === 'create_tenancy')?.done || false,
      onPress: () => {
        onClose();
        if (onCreateTenancy) {
          onCreateTenancy();
        }
      },
    },
    {
      key: 'link_bank',
      title: 'Link your bank Account',
      subtitle: 'For direct rent payments and collection.',
      icon: { ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' },
      isDone: !!profile?.bankAccount?.accountNumber || completion?.steps.find((s) => s.key === 'link_bank')?.done || false,
      onPress: () => {
        setIsBankModalVisible(true);
      },
    },
  ];

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Success Banner (matching Screen 6 in design) */}
        {showSuccessBanner && (
          <View style={styles.topSuccessToast}>
            <View style={styles.toastCheckSquare}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={14}
                tintColor="#FFFFFF"
              />
            </View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <Text style={styles.headerTitle}>Set up your Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Circle with House */}
          <View style={styles.heroWrapper}>
            <View style={styles.heroOuterCircle}>
              <View style={styles.houseIconContainer}>
                <SymbolView
                  name={{ ios: 'house.fill', android: 'home', web: 'home' }}
                  size={52}
                  tintColor="#C5751A"
                />
              </View>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.instructionText}>
            Complete the following to get the full experience!
          </Text>

          {/* Steps List */}
          <View style={styles.stepsContainer}>
            {steps.map((step) => (
              <TouchableOpacity
                key={step.key}
                style={[styles.stepCard, step.isDone && styles.stepCardDone]}
                activeOpacity={0.7}
                onPress={step.onPress}
                disabled={step.isDone && step.key === 'verify_email'}
              >
                <View style={styles.stepCardLeft}>
                  {/* Circular Icon Badge */}
                  <View style={styles.stepIconCircle}>
                    <SymbolView
                      name={step.icon as any}
                      size={20}
                      tintColor="#D87C24"
                    />
                  </View>

                  {/* Texts */}
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>

                {/* Right Status */}
                {step.isDone ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                ) : (
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={16}
                    tintColor="#D87C24"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Continue Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Nested Verify Email Modal */}
        <VerifyEmailModal
          visible={isVerifyEmailVisible}
          onClose={() => setIsVerifyEmailVisible(false)}
          onSuccess={handleEmailVerified}
        />

        {/* Nested Bank Account Modal */}
        <BankAccountModal
          visible={isBankModalVisible}
          onClose={() => {
            setIsBankModalVisible(false);
            dispatch(fetchProfileCompletion());
            dispatch(fetchUserProfile());
          }}
        />
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#D87C24',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroWrapper: {
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOuterCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  houseIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE9D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D87C24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  instructionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  stepsContainer: {
    width: '100%',
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F0EDE6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepCardDone: {
    borderColor: '#E8F5E9',
    backgroundColor: '#FCFDFD',
  },
  stepCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 3,
  },
  stepSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    lineHeight: 16,
  },
  completedBadge: {
    backgroundColor: '#EBFDF2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  completedBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#039855',
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FEFAF4',
  },
  continueBtn: {
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topSuccessToast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1E1B18',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastCheckSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#039855',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
