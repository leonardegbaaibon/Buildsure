import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppScreen } from '@/components/ui/app-screen';
import { getUserName, setActiveTab, setShouldStartAddProperty } from '@/utils/user-store';
import {
  BrandHeader,
  PortfolioCard,
  ActionRow,
  OverviewCard,
} from '@/components/home/home-components';
import NotificationsScreen from '@/components/notifications/notifications-screen';
import CreateTenancyFlow from '@/components/tenancy/create-tenancy-flow';
import UploadContractFlow from '@/components/tenancy/upload-contract-flow';
import ProfileSetupModal from '@/components/profile/profile-setup-modal';
import { useDashboard } from '@/hooks/use-dashboard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notification-slice';
import { fetchProfileCompletion } from '@/store/slices/auth-slice';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const completion = useAppSelector((state) => state.auth.completion);
  const { data, isRefreshing, refetch, formatCurrency, formatPercentChange } = useDashboard();
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isCreateTenancyVisible, setIsCreateTenancyVisible] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [isProfileSetupVisible, setIsProfileSetupVisible] = useState(false);
  const [showTerminationTip, setShowTerminationTip] = useState(true);
  const [activeBannerTenancyId, setActiveBannerTenancyId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    dispatch(fetchUnreadCount());
    dispatch(fetchProfileCompletion());
  }, [dispatch]);

  const handleRefresh = async () => {
    dispatch(fetchUnreadCount());
    dispatch(fetchProfileCompletion());
    await refetch();
  };

  // Compute display name from API or local user store fallback
  const apiUserName = `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
  const displayName = apiUserName || getUserName() || 'User';

  return (
    <AppScreen edges={['top', 'left', 'right']}>
      {/* Brand Header */}
      <BrandHeader
        onNotificationPress={() => setIsNotificationsVisible(true)}
        notificationCount={unreadCount}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D87C24"
            colors={['#D87C24']}
          />
        }
      >
        {/* Profile/Greeting Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userNameText}>{displayName}</Text>
              <Text style={styles.welcomeSubtitle}>
                {(!completion || !completion.isComplete)
                  ? 'Just a few more steps to get started!'
                  : "Here's what is happening with your properties today."}
              </Text>
            </View>
            
            {/* Avatar image frame */}
            <TouchableOpacity
              style={styles.avatarContainer}
              activeOpacity={0.8}
              onPress={() => setActiveTab('profile')}
            >
              {data.user.profilePicture ? (
                <Image
                  source={{ uri: data.user.profilePicture }}
                  style={styles.avatarImageFull}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholderContainer}>
                  <Image
                    source={require('../../assets/images/user_avatar.png')}
                    style={styles.avatarImageFull}
                    resizeMode="cover"
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Setup Your Profile Banner */}
        {(!completion || !completion.isComplete) && (
          <TouchableOpacity
            style={styles.setupBannerCard}
            activeOpacity={0.85}
            onPress={() => setIsProfileSetupVisible(true)}
          >
            <View style={styles.bannerIconCircle}>
              <SymbolView
                name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                size={20}
                tintColor="#D87C24"
              />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Finish Setting Up Your Profile</Text>
              <Text style={styles.bannerSubtitle}>
                {completion?.steps
                  ? `${completion.totalCount - completion.completedCount} steps remaining to complete setup.`
                  : 'Verify your phone number and setup tenants.'}
              </Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
              tintColor="#D87C24"
            />
          </TouchableOpacity>
        )}

        {/* Legal Tip: Tenancy Termination Timelines Banner */}
        {showTerminationTip && (
          <View style={styles.tipBannerCard}>
            <View style={styles.bannerIconCircle}>
              <SymbolView
                name={{ ios: 'scalemass.fill', android: 'balance', web: 'balance' }}
                size={20}
                tintColor="#D87C24"
              />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Tenancy Termination Timelines</Text>
              <Text style={styles.bannerSubtitle}>
                Annual tenancy requires 6 months notice.
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.bannerLinkText}>
                  See which law applies in your state ↗
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowTerminationTip(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={14}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Portfolio Value Card */}
        <PortfolioCard 
          value={formatCurrency(data.portfolioValue.total, data.portfolioValue.currency)} 
          trend={formatPercentChange(data.portfolioValue.percentChange)}
          currency={data.portfolioValue.currency}
          chartData={data.portfolioValue.chartData}
        />

        {/* Dynamic Action Banners from API */}
        {data.banners && data.banners.length > 0 && (
          data.banners.map((banner, index) => (
            <TouchableOpacity 
              key={banner.tenancyId || index}
              style={styles.uploadNudgeContainer} 
              activeOpacity={0.9}
              onPress={() => {
                setActiveBannerTenancyId(banner.tenancyId);
                setIsUploadVisible(true);
              }}
            >
              <View style={styles.uploadNudgeIconContainer}>
                <SymbolView
                  name={{ ios: 'arrow.up.doc.fill', android: 'upload', web: 'upload' }}
                  size={18}
                  tintColor="#D87C24"
                />
              </View>
              <View style={styles.uploadNudgeTextContainer}>
                <Text style={styles.uploadNudgeText}>
                  {banner.message && banner.message !== 'string' ? banner.message : 'Upload the signed contract to complete the tenancy.'}
                </Text>
                <Text style={styles.uploadNudgeLink}>Upload Now ›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Action Row */}
        <ActionRow
          onCreateTenancyPress={() => setIsCreateTenancyVisible(true)}
          onAddPropertyPress={() => {
            setShouldStartAddProperty(true);
            setActiveTab('properties');
          }}
        />

        {/* Overview Stats (2x2 Grid) */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewTitle}>Overview</Text>
          
          <View style={styles.gridRow}>
            <OverviewCard
              title="Total Properties"
              value={data.overview.totalProperties.count.toLocaleString()}
              trend={formatPercentChange(data.overview.totalProperties.percentChange)}
              iconName="house"
              themeColor="orange"
            />
            <OverviewCard
              title="Active Tenancies"
              value={data.overview.activeTenancies.count.toLocaleString()}
              trend={formatPercentChange(data.overview.activeTenancies.percentChange)}
              iconName="person.2"
              themeColor="green"
            />
          </View>

          <View style={[styles.gridRow, { marginTop: 12 }]}>
            <OverviewCard
              title="Held Deposit"
              value={formatCurrency(data.overview.heldDeposit.total, data.overview.heldDeposit.currency)}
              iconName="wallet"
              themeColor="purple"
            />
            <OverviewCard
              title="Total Rental Income"
              value={formatCurrency(data.overview.totalRentalIncome.total, data.overview.totalRentalIncome.currency)}
              iconName="wallet"
              themeColor="cyan"
            />
          </View>
        </View>
      </ScrollView>

      {/* Notifications Modal Overlay */}
      <Modal
        animationType="slide"
        visible={isNotificationsVisible}
        onRequestClose={() => setIsNotificationsVisible(false)}
      >
        <NotificationsScreen onClose={() => setIsNotificationsVisible(false)} />
      </Modal>

      {/* Create Tenancy Flow Overlay */}
      <CreateTenancyFlow
        visible={isCreateTenancyVisible}
        onClose={() => setIsCreateTenancyVisible(false)}
      />

      {/* Upload Signed Contract Modal Overlay */}
      <UploadContractFlow
        visible={isUploadVisible}
        tenancyId={activeBannerTenancyId}
        onClose={() => setIsUploadVisible(false)}
        onComplete={() => {
          setIsUploadVisible(false);
          refetch();
        }}
      />

      {/* Profile Setup Modal Overlay */}
      <ProfileSetupModal
        visible={isProfileSetupVisible}
        onClose={() => {
          setIsProfileSetupVisible(false);
          dispatch(fetchProfileCompletion());
        }}
        onCreateTenancy={() => setIsCreateTenancyVisible(true)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  userNameText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#D87C24',
    marginTop: 4,
  },
  welcomeSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
    marginTop: 6,
    lineHeight: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF4E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImageFull: {
    width: '100%',
    height: '100%',
  },
  overviewSection: {},
  overviewTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadNudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE3C6',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  uploadNudgeIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadNudgeTextContainer: {
    flex: 1,
    gap: 4,
  },
  uploadNudgeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#1A1C1E',
    lineHeight: 18,
  },
  boldText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  uploadNudgeLink: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D87C24',
    fontWeight: '700',
  },
  setupBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE0B2',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tipBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE0B2',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
    lineHeight: 16,
  },
  bannerLinkText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
    marginTop: 6,
  },
});
