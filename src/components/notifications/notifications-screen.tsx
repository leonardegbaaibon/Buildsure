import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import SwipeableNotificationItem, { NotificationData } from './notification-item';

interface NotificationWithGroup extends NotificationData {
  dayGroup: string;
}

const initialNotifications: NotificationWithGroup[] = [
  {
    id: '1',
    type: 'value_update',
    text: 'Hooray! your property value Apo-Wumba Homes has rised by 2.5%.',
    boldSegments: ['Apo-Wumba Homes', '2.5%'],
    time: '10m ago',
    dayGroup: 'Today',
  },
  {
    id: '2',
    type: 'payment_lease',
    text: 'Saad has completed the payment of his rent at Unit A1 for NGN1.2M and equally signed the lease agreement.',
    boldSegments: ['Unit A1', 'NGN1.2M'],
    time: '09:55 AM',
    dayGroup: 'Today',
  },
  {
    id: '3',
    type: 'value_update',
    text: 'Hooray! your property value Apo-Wumba Homes has rised by 2.5%.',
    boldSegments: ['Apo-Wumba Homes', '2.5%'],
    time: '10m ago',
    dayGroup: 'Yesterday',
  },
  {
    id: '4',
    type: 'payment_lease',
    text: 'Saad has completed the payment of his rent at Unit A1 for NGN1.2M and equally signed the lease agreement.',
    boldSegments: ['Unit A1', 'NGN1.2M'],
    time: '09:55 AM',
    dayGroup: 'Yesterday',
  },
  {
    id: '5',
    type: 'value_update',
    text: 'Hooray! your property value Apo-Wumba Homes has rised by 2.5%.',
    boldSegments: ['Apo-Wumba Homes', '2.5%'],
    time: '10m ago',
    dayGroup: 'Yesterday-2',
  },
  {
    id: '6',
    type: 'payment_lease',
    text: 'Saad has completed the payment of his rent at Unit A1 for NGN1.2M and equally signed the lease agreement.',
    boldSegments: ['Unit A1', 'NGN1.2M'],
    time: '09:55 AM',
    dayGroup: 'Yesterday-2',
  },
  {
    id: '7',
    type: 'value_update',
    text: 'Hooray! your property value Apo-Wumba Homes has rised by 2.5%.',
    boldSegments: ['Apo-Wumba Homes', '2.5%'],
    time: '10m ago',
    dayGroup: 'Saturday',
  },
  {
    id: '8',
    type: 'payment_lease',
    text: 'Saad has completed the payment of his rent at Unit A1 for NGN1.2M and equally signed the lease agreement.',
    boldSegments: ['Unit A1', 'NGN1.2M'],
    time: '09:55 AM',
    dayGroup: 'Saturday',
  },
];

interface NotificationsScreenProps {
  onClose: () => void;
}

export default function NotificationsScreen({ onClose }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<NotificationWithGroup[]>(initialNotifications);

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => setNotifications([]) }
      ]
    );
  };

  // Group notifications dynamically for rendering section titles
  const renderGroupedList = () => {
    const groups: { [key: string]: NotificationWithGroup[] } = {};
    const groupKeys: string[] = [];

    notifications.forEach(item => {
      if (!groups[item.dayGroup]) {
        groups[item.dayGroup] = [];
        groupKeys.push(item.dayGroup);
      }
      groups[item.dayGroup].push(item);
    });

    return groupKeys.map((groupKey) => {
      const displayTitle = groupKey.replace('-2', '');
      const itemsInGroup = groups[groupKey];

      return (
        <View key={groupKey} style={styles.groupContainer}>
          <View style={styles.groupHeaderContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.groupTitle}>{displayTitle}</Text>
          </View>

          <View>
            {itemsInGroup.map(item => (
              <SwipeableNotificationItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={18}
            tintColor="#1A1C1E"
            weight="bold"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.headerRightMenu}
          onPress={handleClearAll}
          activeOpacity={0.7}
        >
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' } as const}
            size={18}
            tintColor="#D87C24"
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {notifications.length > 0 ? (
          renderGroupedList()
        ) : (
          <View style={styles.emptyContainer}>
            <SymbolView
              name={{ ios: 'bell.slash', android: 'notifications_off', web: 'notifications_off' }}
              size={64}
              tintColor="#EBE6DC"
            />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up for today!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#D87C24',
    textAlign: 'center',
  },
  headerRightMenu: {
    position: 'absolute',
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  body: {
    flex: 1,
  },
  groupContainer: {
    marginTop: 8,
  },
  groupHeaderContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#EBE6DC',
    marginBottom: 12,
  },
  groupTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8D93',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 180,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  emptySubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#8A8D93',
  },
});
