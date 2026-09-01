import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { ApiNotificationItem, NotificationType } from '@/types/notification';

export interface DisplayNotificationData extends ApiNotificationItem {
  timeAgo: string;
  dayGroup: string;
}

interface NotificationItemProps {
  item: DisplayNotificationData;
  onDelete: (id: string) => void;
  onPress?: (id: string) => void;
}

export default function SwipeableNotificationItem({
  item,
  onDelete,
  onPress,
}: NotificationItemProps) {
  const translateX = useSharedValue(0);
  const swipeLimit = -80; // Width of the delete button

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const nextX = Math.max(swipeLimit - 30, Math.min(0, event.translationX));
      translateX.value = nextX;
    })
    .onEnd((event) => {
      if (event.velocityX < -500 || translateX.value < swipeLimit * 0.5) {
        translateX.value = withSpring(swipeLimit, { damping: 15 });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = () => {
    translateX.value = withSpring(0, { damping: 15 }, (finished) => {
      if (finished) {
        runOnJS(onDelete)(item.id);
      }
    });
  };

  const handleRowPress = () => {
    if (onPress) {
      onPress(item.id);
    }
  };

  // Helper to render proper icon per notification type
  const renderTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'rent_due':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
            <SymbolView
              name={{ ios: 'creditcard.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
              size={20}
              tintColor="#D87C24"
            />
          </View>
        );
      case 'maintenance':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEE4E2', borderColor: '#FECDCA' }]}>
            <SymbolView
              name={{ ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }}
              size={20}
              tintColor="#D92D20"
            />
          </View>
        );
      case 'lease_renewal':
      case 'tenancy':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
            <SymbolView
              name={{ ios: 'doc.badge.arrow.up.fill', android: 'assignment', web: 'assignment' }}
              size={20}
              tintColor="#0284C7"
            />
          </View>
        );
      case 'property':
      case 'value_update':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#EBFDF2', borderColor: '#A6F4C5' }]}>
            <SymbolView
              name={{ ios: 'building.2.fill', android: 'apartment', web: 'apartment' }}
              size={20}
              tintColor="#039855"
            />
          </View>
        );
      case 'system':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FFF4E5', borderColor: '#FFE0B2' }]}>
            <SymbolView
              name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              size={20}
              tintColor="#D87C24"
            />
          </View>
        );
    }
  };

  return (
    <Animated.View
      layout={LinearTransition}
      exiting={FadeOut.duration(250)}
      style={styles.container}
    >
      {/* Absolute positioned Delete Action Button */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <SymbolView
            name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
            size={22}
            tintColor="#FFFFFF"
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      {/* Main Swipeable Row Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.mainRow, animatedRowStyle, !item.isRead && styles.unreadRow]}>
          <TouchableOpacity
            style={styles.touchableContent}
            activeOpacity={0.8}
            onPress={handleRowPress}
          >
            {/* Left Icon */}
            {renderTypeIcon(item.type)}

            {/* Text and Time Column */}
            <View style={styles.contentColumn}>
              <View style={styles.titleRow}>
                <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
                  {item.title || 'Notification'}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.notificationMessage} numberOfLines={3}>
                {item.message}
              </Text>

              <Text style={styles.timeText}>{item.timeAgo}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FEFAF4',
  },
  mainRow: {
    backgroundColor: '#FEFAF4',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    zIndex: 2,
  },
  unreadRow: {
    backgroundColor: '#FFFDF9',
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '700',
    flex: 1,
  },
  unreadTitle: {
    color: '#D87C24',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D87C24',
  },
  notificationMessage: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  timeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    marginTop: 2,
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F04438',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
