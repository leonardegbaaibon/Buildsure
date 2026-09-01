import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import SwipeableNotificationItem, { DisplayNotificationData } from './notification-item';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  clearAllNotifications,
} from '@/store/slices/notification-slice';

interface NotificationsScreenProps {
  onClose: () => void;
}

export default function NotificationsScreen({ onClose }: NotificationsScreenProps) {
  const dispatch = useAppDispatch();
  const { notifications, isLoading, isRefreshing, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 30 }));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchNotifications({ page: 1, limit: 30, isRefresh: true }));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNotificationById(id));
  };

  const handleItemPress = (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (item && !item.isRead) {
      dispatch(markNotificationAsRead(id));
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleClearAll = () => {
    CustomAlert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearAllNotifications()),
        },
      ]
    );
  };

  const handleMenuPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Mark all as read', 'Clear all notifications'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleMarkAllRead();
          } else if (buttonIndex === 2) {
            handleClearAll();
          }
        }
      );
    } else {
      CustomAlert.alert('Notification Options', 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark all as read', onPress: handleMarkAllRead },
        { text: 'Clear all', style: 'destructive', onPress: handleClearAll },
      ]);
    }
  };

  // Convert and group notifications by day group
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const groups: { [key: string]: DisplayNotificationData[] } = {};
    const groupKeys: string[] = [];

    notifications.forEach((item) => {
      const itemDate = new Date(item.createdAt || Date.now());
      const itemDateStr = itemDate.toDateString();

      let dayGroup = 'Earlier';
      if (itemDateStr === todayStr) {
        dayGroup = 'Today';
      } else if (itemDateStr === yesterdayStr) {
        dayGroup = 'Yesterday';
      } else {
        const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          dayGroup = itemDate.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
          dayGroup = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      // Format timeAgo
      let timeAgo = '';
      const diffMs = now.getTime() - itemDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        timeAgo = 'Just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24 && dayGroup === 'Today') {
        timeAgo = itemDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        timeAgo = itemDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      const displayItem: DisplayNotificationData = {
        ...item,
        timeAgo,
        dayGroup,
      };

      if (!groups[dayGroup]) {
        groups[dayGroup] = [];
        groupKeys.push(dayGroup);
      }
      groups[dayGroup].push(displayItem);
    });

    return { groups, groupKeys };
  }, [notifications]);

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
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
          onPress={handleMenuPress}
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

      {/* Notifications List */}
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
        {isLoading && !isRefreshing && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D87C24" />
          </View>
        ) : notifications.length > 0 ? (
          groupedNotifications.groupKeys.map((groupKey) => (
            <View key={groupKey} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{groupKey}</Text>
              {groupedNotifications.groups[groupKey].map((item) => (
                <SwipeableNotificationItem
                  key={item.id}
                  item={item}
                  onPress={handleItemPress}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <SymbolView
                name={{ ios: 'bell.slash.fill', android: 'notifications_off', web: 'notifications_off' }}
                size={32}
                tintColor="#D87C24"
              />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up for today!</Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
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
  subHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  subHeaderText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  subHeaderBold: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontWeight: '700',
  },
  markAllReadText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#D87C24',
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    paddingBottom: 40,
  },
  groupHeader: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8D93',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 140,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
