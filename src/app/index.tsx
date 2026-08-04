import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
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
import { useDashboard } from '@/hooks/use-dashboard';

export default function HomeScreen() {
  const { data, isRefreshing, refetch, formatCurrency, formatPercentChange } = useDashboard();
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isCreateTenancyVisible, setIsCreateTenancyVisible] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);

  // Compute display name from API or local user store fallback
  const apiUserName = `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
  const displayName = apiUserName || getUserName() || 'User';

  return (
    <SafeAreaView style={styles.container}>
      {/* Brand Header */}
      <BrandHeader onNotificationPress={() => setIsNotificationsVisible(true)} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
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
                Here's what is happening with your properties today.
              </Text>
            </View>
            
            {/* Avatar image frame */}
            <View style={styles.avatarContainer}>
              {data.user.profilePicture ? (
                <Image
                  source={{ uri: data.user.profilePicture }}
                  style={styles.avatarImageFull}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Image
                    source={require('../../assets/images/favicon.png')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <View style={styles.avatarOverlay}>
                    <SymbolView
                      name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                      size={24}
                      tintColor="#D87C24"
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

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
              onPress={() => setIsUploadVisible(true)}
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
        onClose={() => setIsUploadVisible(false)}
        onComplete={() => {
          setIsUploadVisible(false);
          refetch();
        }}
      />
    </SafeAreaView>
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
    borderColor: '#EBE6DC',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  avatarImageFull: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
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
});
