import React from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  text?: string;
}

export function SwipeButton({ onSwipeComplete, text = 'Get Started' }: SwipeButtonProps) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const translateX = useSharedValue(0);
  const isComplete = useSharedValue(false);

  const handleWidth = 60;
  const padding = 6;
  const maxTranslate = trackWidth ? trackWidth - handleWidth - padding * 2 : 0;

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isComplete.value || maxTranslate === 0) return;
      const nextX = Math.max(0, Math.min(event.translationX, maxTranslate));
      translateX.value = nextX;
    })
    .onEnd(() => {
      if (isComplete.value || maxTranslate === 0) return;

      // If swiped more than 75% of the way, complete the action
      if (translateX.value > maxTranslate * 0.75) {
        translateX.value = withSpring(maxTranslate, { damping: 15 });
        isComplete.value = true;
        runOnJS(onSwipeComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => {
    // Fade out text as we swipe
    const opacity = maxTranslate ? Math.max(0, 1 - (translateX.value / maxTranslate) * 1.5) : 1;
    return { opacity };
  });

  // Reset completion state when text/screen changes (e.g. going between onboarding pages)
  React.useEffect(() => {
    translateX.value = 0;
    isComplete.value = false;
  }, [text]);

  return (
    <View 
      style={styles.track} 
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.arrowText}>»</Text>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.handle, animatedHandleStyle]}>
          <SymbolView
            name={{ ios: 'house', android: 'home', web: 'home' }}
            size={24}
            tintColor="#FFFFFF"
            weight="semibold"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 72,
    backgroundColor: '#2A2C30',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    pointerEvents: 'none',
  },
  arrowText: {
    fontFamily: 'Satoshi-Bold',
    color: '#8A8D93',
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  handle: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 60,
    height: 60,
    backgroundColor: '#FFA726', // Warm amber/orange color
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
