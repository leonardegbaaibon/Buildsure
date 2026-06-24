import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { getUserName } from '@/utils/user-store';
import {
  BrandHeader,
  PortfolioCard,
  ActionRow,
  OverviewCard,
  NotificationNudge,
} from '@/components/home/home-components';
import NotificationsScreen from '@/components/notifications/notifications-screen';
import CreateTenancyFlow from '@/components/tenancy/create-tenancy-flow';

export default function HomeScreen() {
  const userName = getUserName() || 'Saad Bashar';
  const [showNudge, setShowNudge] = useState(true);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isCreateTenancyVisible, setIsCreateTenancyVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Brand Header */}
      <BrandHeader onNotificationPress={() => setIsNotificationsVisible(true)} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Nudge */}
        {showNudge && (
          <NotificationNudge 
            onClose={() => setShowNudge(false)} 
            onNotificationPress={() => setIsNotificationsVisible(true)}
          />
        )}

        {/* Profile/Greeting Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userNameText}>{userName}</Text>
              <Text style={styles.welcomeSubtitle}>
                Here's what is happening with your properties today.
              </Text>
            </View>
            
            {/* Avatar image frame */}
            <View style={styles.avatarContainer}>
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
            </View>
          </View>
        </View>

        {/* Portfolio Value Card (Unblurred amount with vs last month trend) */}
        <PortfolioCard 
          value="₦98,400,000" 
          trend="+2.65%" 
        />

        {/* Action Row */}
        <ActionRow onCreateTenancyPress={() => setIsCreateTenancyVisible(true)} />

        {/* Overview Stats (2x2 Grid) */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewTitle}>Overview</Text>
          
          <View style={styles.gridRow}>
            <OverviewCard
              title="Total Properties"
              value="2"
              trend="+1.3%"
              iconName="house"
              themeColor="orange"
            />
            <OverviewCard
              title="Active Tenancies"
              value="24"
              trend="+1.3%"
              iconName="person.2"
              themeColor="green"
            />
          </View>

          <View style={[styles.gridRow, { marginTop: 12 }]}>
            <OverviewCard
              title="Occupancy Rate"
              value="80%"
              iconName="person.2"
              themeColor="purple"
            />
            <OverviewCard
              title="Total Rental Income"
              value="₦4,800,000"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
});
