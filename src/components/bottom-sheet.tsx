import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';

export interface BottomSheetOption {
  label: string;
  onPress: () => void;
  type?: 'default' | 'danger';
}

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options?: BottomSheetOption[];
  children?: React.ReactNode;
}

export function AppBottomSheet({
  visible,
  onClose,
  title,
  options,
  children,
}: AppBottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [showModal, setShowModal] = useState(visible);
  
  // Animated value for visibility (0 = closed, 1 = open)
  const animValue = useRef(new Animated.Value(0)).current;
  
  // Pan responder animated value
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  // Set up PanResponder for drag-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger responder if user is dragging downwards
        return gestureState.dy > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Drag downwards only
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          // Dragged far enough or fast enough to dismiss
          Animated.timing(pan.y, {
            toValue: windowHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            // Reset pan position after close
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          // Snap back up
          Animated.spring(pan.y, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    })
  ).current;

  // Combine entrance animation and gesture positioning
  const translateY = Animated.add(
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [windowHeight, 0],
    }),
    pan.y
  );

  // Overlay opacity transition
  const overlayOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            styles.backdrop, 
            { opacity: overlayOpacity }
          ]} 
        >
          <Pressable style={styles.modalDismiss} onPress={onClose} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.bottomSheet, 
            { transform: [{ translateY }] }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandle} />

          {title && <Text style={styles.sheetTitle}>{title}</Text>}

          {children}

          {options && options.map((option, index) => {
            const isDanger = option.type === 'danger';
            return (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isDanger && styles.optionTextDanger]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E0D8',
    marginBottom: 20,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  optionTextDanger: {
    color: '#EF4444',
  },
});

