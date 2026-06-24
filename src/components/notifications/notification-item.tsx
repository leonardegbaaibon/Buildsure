import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
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

export interface NotificationData {
  id: string;
  type: 'value_update' | 'payment_lease';
  text: string; // The formatted string or HTML style text where we parse bold elements
  boldSegments: string[]; // List of substrings to bold
  time: string;
}

interface NotificationItemProps {
  item: NotificationData;
  onDelete: (id: string) => void;
}

export default function SwipeableNotificationItem({ item, onDelete }: NotificationItemProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue<number | undefined>(undefined);
  const swipeLimit = -80; // Width of the delete button

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only trigger for horizontal movements, allowing normal vertical scrolling
    .onUpdate((event) => {
      // Swipe left only. translationX is negative.
      const nextX = Math.max(swipeLimit - 30, Math.min(0, event.translationX));
      translateX.value = nextX;
    })
    .onEnd((event) => {
      // If velocity is fast left, or swiped past 50%, snap open. Otherwise, snap closed.
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
    // Snap closed first, then call onDelete
    translateX.value = withSpring(0, { damping: 15 }, (finished) => {
      if (finished) {
        runOnJS(onDelete)(item.id);
      }
    });
  };

  // Render text helper to bold specific terms in the notification body
  const renderTextWithBolds = (fullText: string, boldSegments: string[]) => {
    if (!boldSegments || boldSegments.length === 0) {
      return <Text style={styles.notificationText}>{fullText}</Text>;
    }

    // Split text based on bold terms using a regex
    const escapedTerms = boldSegments.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'g');
    const parts = fullText.split(regex);

    return (
      <Text style={styles.notificationText}>
        {parts.map((part, index) => {
          const isBold = boldSegments.includes(part);
          return (
            <Text
              key={index}
              style={isBold ? styles.boldText : null}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
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
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={24}
            tintColor="#FFFFFF"
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      {/* Main Swipeable Row Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.mainRow, animatedRowStyle]}>
          {/* Left Icon / Thumbnail */}
          {item.type === 'value_update' ? (
            <Image
              source={require('../../../assets/images/apo_wumba.png')}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.profileCircle}>
              <SymbolView
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                size={22}
                tintColor="#D87C24"
              />
            </View>
          )}

          {/* Text and Time Column */}
          <View style={styles.contentColumn}>
            {renderTextWithBolds(item.text, item.boldSegments)}
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    zIndex: 2,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EBE6DC',
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  contentColumn: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  notificationText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
    lineHeight: 20,
  },
  boldText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#D87C24',
  },
  timeText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#8A8D93',
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
    backgroundColor: '#FF3B30', // Red background
    justifyContent: 'center',
    alignItems: 'center',
  },
});
