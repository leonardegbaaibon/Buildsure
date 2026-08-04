import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { BackButton } from '@/components/auth/back-button';
import { AppBottomSheet } from '@/components/bottom-sheet';
import { getUserName, getUserPhone, setFlowState, setActiveTab } from '@/utils/user-store';
import EditProfileModal from '@/components/profile/edit-profile-modal';
import ChangePasswordModal from '@/components/profile/change-password-modal';
import { authService } from '@/utils/auth-service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/auth-slice';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const [userName, setUserNameState] = useState(getUserName() || 'User');
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);

  // Bottom sheets
  const [isWalletInfoVisible, setIsWalletInfoVisible] = useState(false);
  const [isEarningsInfoVisible, setIsEarningsInfoVisible] = useState(false);
  const [isBankInfoVisible, setIsBankInfoVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);

  const displayName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    : userName;
  const email = profile?.email || 'email@example.com';
  const isVerified = profile?.isPhoneVerified || profile?.isEmailVerified;

  const handleBack = () => {
    setActiveTab('home');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            // Wipes secure persistent credentials and state
            await authService.signOut();
            // Reset to onboarding flow
            setFlowState('onboarding');
          },
        },
      ]
    );
  };

  const refreshName = () => {
    setUserNameState(getUserName() || 'Saad Bashar');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userNameText}>{displayName}</Text>
            <Text style={styles.userEmailText}>{email}</Text>
          </View>

          {/* Avatar Container with Active Indicator */}
          <View style={styles.avatarContainer}>
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
            {/* Green Online Dot */}
            <View style={styles.activeDot} />
          </View>
        </View>

        {/* Side-by-Side Metric Cards */}
        <View style={styles.metricsContainer}>
          {/* Wallet Card */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.9}
            onPress={() => setIsWalletInfoVisible(true)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>Wallet</Text>
                <SymbolView
                  name={{ ios: 'info.circle', android: 'info', web: 'info' }}
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
            <Text style={styles.cardValue}>₦0</Text>
            <View style={styles.trendRow}>
              <SymbolView
                name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
                size={10}
                tintColor="#2E7D32"
              />
              <Text style={styles.trendText}>
                <Text style={styles.trendGreen}>+0.0%</Text>
                <Text style={styles.trendGray}> vs last month</Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bank Earnings Card */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.9}
            onPress={() => setIsEarningsInfoVisible(true)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>Bank Earnings</Text>
                <SymbolView
                  name={{ ios: 'info.circle', android: 'info', web: 'info' }}
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
            <Text style={styles.cardValue}>₦0</Text>
            <View style={styles.trendRow}>
              <SymbolView
                name={{ ios: 'triangle.fill', android: 'arrow_drop_up', web: 'arrow_drop_up' }}
                size={10}
                tintColor="#2E7D32"
              />
              <Text style={styles.trendText}>
                <Text style={styles.trendGreen}>+0.0%</Text>
                <Text style={styles.trendGray}> vs last month</Text>
              </Text>
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
            onPress={() => setIsNotificationsVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Notifications</Text>
            </View>
          </TouchableOpacity>

          {/* Bank Information */}
          <TouchableOpacity 
            style={styles.listItem} 
            activeOpacity={0.7}
            onPress={() => setIsBankInfoVisible(true)}
          >
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Bank Information</Text>
            </View>
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
          </TouchableOpacity>

          {/* Talk to Support */}
          <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'bubble.left.and.bubble.right.fill', android: 'chat', web: 'chat' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>Talk to Support</Text>
            </View>
          </TouchableOpacity>

          {/* My Contract Template */}
          <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
            <View style={styles.listItemLeft}>
              <SymbolView
                name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                size={20}
                tintColor="#D87C24"
              />
              <Text style={styles.listItemText}>My Contract Template</Text>
            </View>
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

      {/* 3. Bank Information Bottom Sheet */}
      <AppBottomSheet
        visible={isBankInfoVisible}
        onClose={() => setIsBankInfoVisible(false)}
        showGlowBackground={true}
      >
        <Text style={styles.sheetTitle}>Bank Account Details</Text>
        <View style={{ gap: 12, width: '100%', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#6C757D' }}>Bank Name:</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#1A1C1E' }}>
              {profile?.bankAccount?.bankName || 'Not Set'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#6C757D' }}>Account Number:</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#1A1C1E' }}>
              {profile?.bankAccount?.accountNumber || 'Not Set'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#6C757D' }}>Account Name:</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#1A1C1E' }}>
              {profile?.bankAccount?.accountName || 'Not Set'}
            </Text>
          </View>
        </View>
      </AppBottomSheet>

      {/* 4. Notification Preferences Bottom Sheet */}
      <AppBottomSheet
        visible={isNotificationsVisible}
        onClose={() => setIsNotificationsVisible(false)}
        showGlowBackground={true}
      >
        <Text style={styles.sheetTitle}>Notification Preferences</Text>
        <View style={{ gap: 12, width: '100%', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#1A1C1E' }}>Login Email Alerts</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#D87C24' }}>
              {profile?.notificationPreferences?.loginAlertsEmail !== false ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#1A1C1E' }}>Property Email Alerts</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#D87C24' }}>
              {profile?.notificationPreferences?.propertyAlertsEmail !== false ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', color: '#1A1C1E' }}>Property Push Alerts</Text>
            <Text style={{ fontFamily: 'Satoshi-Bold', color: '#D87C24' }}>
              {profile?.notificationPreferences?.propertyAlertsPush !== false ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </AppBottomSheet>

      {/* 5. Wallet Info Bottom Sheet */}
      <AppBottomSheet
        visible={isWalletInfoVisible}
        onClose={() => setIsWalletInfoVisible(false)}
        showGlowBackground={true}
      >
        <View style={styles.sheetBadgeContainer}>
          <Image
            source={require('../../assets/images/sheet_bg_glow.png')}
            style={styles.sheetPrimaryIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.sheetTitle}>Wallet</Text>
        <Text style={styles.sheetSubtitle}>
          This balance consists mainly of active tenant security deposits. These funds are safely held
          in escrow and cannot be withdrawn into your personal or business bank account.
        </Text>
      </AppBottomSheet>

      {/* 6. Bank Earnings Info Bottom Sheet */}
      <AppBottomSheet
        visible={isEarningsInfoVisible}
        onClose={() => setIsEarningsInfoVisible(false)}
        showGlowBackground={true}
      >
        <View style={styles.sheetBadgeContainer}>
          <Image
            source={require('../../assets/images/sheet_bg_glow.png')}
            style={styles.sheetPrimaryIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.sheetTitle}>Bank Earnings</Text>
        <Text style={styles.sheetSubtitle}>
          This figure reflects the cumulative tenancy earnings processed and settled into your personal
          bank account. It serves as a historical record of your payouts.
        </Text>
      </AppBottomSheet>
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  profileTextContainer: {
    flex: 1,
    paddingRight: 16,
    gap: 4,
  },
  userNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  userEmailText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#EBE6DC',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  activeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#FEFAF4',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE3C6',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  cardIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#D87C24',
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    fontWeight: '500',
  },
  trendGreen: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  trendGray: {
    color: '#8A8D93',
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupHeaderBar: {
    height: 38,
    backgroundColor: '#FFF5EB', // Soft light beige background bar
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  groupHeaderText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9', // Soft light green
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  logoutText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#F04438',
    fontWeight: '700',
  },
  sheetBadgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  sheetTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'left',
    marginBottom: 10,
    width: '100%',
  },
  sheetSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'left',
    lineHeight: 22,
    width: '100%',
  },
  sheetPrimaryIcon: {
    width: 56,
    height: 56,
  },
});
