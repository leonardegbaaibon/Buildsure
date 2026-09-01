import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '@/components/auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { getUserName, setFlowState, setActiveTab } from '@/utils/user-store';
import EditProfileModal from '@/components/profile/edit-profile-modal';
import ChangePasswordModal from '@/components/profile/change-password-modal';
import BankAccountModal from '@/components/profile/bank-account-modal';
import NotificationPreferencesModal from '@/components/profile/notification-preferences-modal';
import WalletModal from '@/components/profile/wallet-modal';
import ProfileSetupModal from '@/components/profile/profile-setup-modal';
import { authService } from '@/utils/auth-service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserProfile,
  fetchWallet,
  fetchProfileCompletion,
  fetchBankAccount,
} from '@/store/slices/auth-slice';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  const wallet = useAppSelector((state) => state.auth.wallet);
  const completion = useAppSelector((state) => state.auth.completion);
  const bankAccount = useAppSelector((state) => state.auth.bankAccount);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserNameState] = useState(getUserName() || 'User');

  // Modals state
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const [isProfileSetupVisible, setIsProfileSetupVisible] = useState(false);

  const loadAllData = async () => {
    await Promise.all([
      dispatch(fetchUserProfile()),
      dispatch(fetchWallet()),
      dispatch(fetchProfileCompletion()),
      dispatch(fetchBankAccount()),
    ]);
  };

  useEffect(() => {
    loadAllData();
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  const displayName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    : userName;
  const email = profile?.email || 'email@example.com';
  const isVerified = profile?.isPhoneVerified || profile?.isEmailVerified;

  const handleBack = () => {
    setActiveTab('home');
  };

  const handleLogout = () => {
    CustomAlert.alert(
      'Log out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
            setFlowState('onboarding');
          },
        },
      ]
    );
  };

  const refreshName = () => {
    setUserNameState(getUserName() || 'Saad Bashar');
    dispatch(fetchUserProfile());
  };

  const walletBalance = wallet?.balance ?? 0;
  const bankEarnings = wallet?.bankEarnings ?? 0;

  return (
    <AppScreen edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Profile & Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D87C24"
            colors={['#D87C24']}
          />
        }
      >
        {/* Profile Card Header */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userNameText}>{displayName}</Text>
            <Text style={styles.userEmailText}>{email}</Text>
          </View>

          {/* Avatar Container with Active Indicator */}
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.8}
            onPress={() => setIsEditProfileVisible(true)}
          >
            {profile?.profilePicture && profile.profilePicture.startsWith('http') ? (
              <Image
                source={{ uri: profile.profilePicture }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../assets/images/user_avatar.png')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.activeDot} />
          </TouchableOpacity>
        </View>

        {/* Profile Completion Checklist Banner */}
        {completion && !completion.isComplete && (
          <TouchableOpacity
            style={styles.completionBanner}
            activeOpacity={0.85}
            onPress={() => setIsProfileSetupVisible(true)}
          >
            <View style={styles.completionHeaderRow}>
              <View style={styles.completionTitleRow}>
                <SymbolView
                  name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
                  size={18}
                  tintColor="#D87C24"
                />
                <Text style={styles.completionTitle}>Profile Setup Checklist</Text>
              </View>
              <Text style={styles.completionBadge}>
                {completion.completedCount}/{completion.totalCount} completed →
              </Text>
            </View>

            <View style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round((completion.completedCount / (completion.totalCount || 1)) * 100)}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.stepsList}>
              {completion.steps.map((step) => (
                <View key={step.key} style={styles.stepItem}>
                  <SymbolView
                    name={{
                      ios: step.done ? 'checkmark.circle.fill' : 'circle',
                      android: step.done ? 'check_circle' : 'radio_button_unchecked',
                      web: step.done ? 'check_circle' : 'radio_button_unchecked',
                    }}
                    size={16}
                    tintColor={step.done ? '#039855' : '#8A8D93'}
                  />
                  <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Side-by-Side Metric Cards */}
        <View style={styles.metricsContainer}>
          {/* Wallet Card */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => setIsWalletModalVisible(true)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>Wallet</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={12}
                  tintColor="#8A8D93"
                />
              </View>
              <View style={styles.cardIconCircle}>
                <SymbolView
                  name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
                  size={14}
                  tintColor="#D87C24"
                />
              </View>
            </View>
            <Text style={styles.cardValue}>
              ₦{walletBalance.toLocaleString('en-US')}
            </Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendOrange}>Tap to manage & withdraw →</Text>
            </View>
          </TouchableOpacity>

          {/* Bank Earnings Card */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => setIsWalletModalVisible(true)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>Bank Earnings</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={12}
                  tintColor="#8A8D93"
                />
              </View>
              <View style={styles.cardIconCircle}>
                <SymbolView
                  name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                  size={14}
                  tintColor="#D87C24"
                />
              </View>
            </View>
            <Text style={styles.cardValue}>
              ₦{bankEarnings.toLocaleString('en-US')}
            </Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendGray}>Settled to bank account</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: ACCOUNT */}
        <View style={styles.settingsGroup}>
          <View style={styles.groupHeaderBar}>
            <Text style={styles.groupHeaderText}>ACCOUNT</Text>
          </View>

          {/* Your Profile */}
          <TouchableOpacity
            style={styles.listItem}
            activeOpacity={0.7}
            onPress={() => setIsEditProfileVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Your Profile</Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#8A8D93"
            />
          </TouchableOpacity>

          {/* Account Verification */}
          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Account Verification</Text>
            </View>
            <View style={[styles.verifiedBadge, !isVerified && { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.verifiedBadgeText, !isVerified && { color: '#E65100' }]}>
                {isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>

          {/* Notifications */}
          <TouchableOpacity 
            style={styles.listItem} 
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Notification Preferences</Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#8A8D93"
            />
          </TouchableOpacity>

          {/* Bank Information */}
          <TouchableOpacity 
            style={styles.listItem} 
            activeOpacity={0.7}
            onPress={() => setIsBankModalVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                size={20}
                tintColor="#D87C24"
              />
              <View>
                <Text style={styles.listItemText}>Bank Account</Text>
                {bankAccount?.bankName && (
                  <Text style={styles.listItemSubText}>
                    {bankAccount.bankName} ••••{(bankAccount.accountNumber || '').slice(-4)}
                  </Text>
                )}
              </View>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#8A8D93"
            />
          </TouchableOpacity>
        </View>

        {/* Section: OTHERS */}
        <View style={styles.settingsGroup}>
          <View style={styles.groupHeaderBar}>
            <Text style={styles.groupHeaderText}>OTHERS</Text>
          </View>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.listItem}
            activeOpacity={0.7}
            onPress={() => setIsChangePasswordVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'key.fill', android: 'vpn_key', web: 'vpn_key' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Change Password</Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#8A8D93"
            />
          </TouchableOpacity>
        </View>

        {/* Center Log out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <SymbolView
            name={{ ios: 'rectangle.portrait.and.arrow.forward', android: 'exit_to_app', web: 'exit_to_app' }}
            size={18}
            tintColor="#F04438"
          />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 1. Edit Profile Modal */}
      <EditProfileModal
        visible={isEditProfileVisible}
        onClose={() => setIsEditProfileVisible(false)}
        onUpdate={refreshName}
      />

      {/* 2. Change Password Modal */}
      <ChangePasswordModal
        visible={isChangePasswordVisible}
        onClose={() => setIsChangePasswordVisible(false)}
      />

      {/* 3. Bank Account Modal */}
      <BankAccountModal
        visible={isBankModalVisible}
        onClose={() => setIsBankModalVisible(false)}
      />

      {/* 4. Notification Preferences Modal */}
      <NotificationPreferencesModal
        visible={isNotificationsModalVisible}
        onClose={() => setIsNotificationsModalVisible(false)}
      />

      {/* 5. Wallet & Withdrawal Modal */}
      <WalletModal
        visible={isWalletModalVisible}
        onClose={() => setIsWalletModalVisible(false)}
        onOpenBankModal={() => setIsBankModalVisible(true)}
      />

      {/* 6. Profile Setup Checklist Modal */}
      <ProfileSetupModal
        visible={isProfileSetupVisible}
        onClose={() => {
          setIsProfileSetupVisible(false);
          dispatch(fetchProfileCompletion());
        }}
      />
    </AppScreen>
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 150,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  userNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  userEmailText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
  },
  avatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EBE6DC',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#039855',
    borderWidth: 2,
    borderColor: '#FEFAF4',
  },
  completionBanner: {
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 16,
    marginBottom: 20,
  },
  completionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  completionBadge: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#D87C24',
    fontWeight: '700',
  },
  progressBarWrapper: {
    height: 6,
    backgroundColor: '#F0EDE6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 3,
  },
  stepsList: {
    gap: 6,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#1A1C1E',
  },
  stepLabelDone: {
    color: '#8A8D93',
    textDecorationLine: 'line-through',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#6C757D',
  },
  cardIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  trendRow: {
    marginTop: 2,
  },
  trendOrange: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    color: '#D87C24',
    fontWeight: '700',
  },
  trendGray: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    color: '#8A8D93',
  },
  settingsGroup: {
    marginBottom: 20,
  },
  groupHeaderBar: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupHeaderText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8D93',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listItemText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '600',
  },
  listItemSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#EBFDF2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#039855',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  logoutText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#F04438',
    fontWeight: '700',
  },
});
