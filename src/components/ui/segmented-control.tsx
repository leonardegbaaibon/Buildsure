import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, LayoutChangeEvent, StyleProp, ViewStyle, DimensionValue } from 'react-native';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({
  values,
  selectedIndex,
  onChange,
  width = 220,
  style,
}: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState<number>(typeof width === 'number' ? width : 0);
  const animValue = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: selectedIndex,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: w } = event.nativeEvent.layout;
    setContainerWidth(w);
  };

  const innerWidth = containerWidth - 3; // width - 2 * 1.5 border
  const pillWidth = containerWidth > 0 ? (innerWidth - 6) / values.length : 0;

  return (
    <View 
      style={[styles.control, { width }, style]}
      onLayout={onLayout}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingPill,
            {
              width: pillWidth,
              transform: [
                {
                  translateX: animValue.interpolate({
                    inputRange: values.map((_, i) => i),
                    outputRange: values.map((_, i) => i * pillWidth),
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {values.map((val, idx) => {
        const isActive = idx === selectedIndex;
        return (
          <TouchableOpacity
            key={val}
            style={styles.button}
            onPress={() => onChange(idx)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.text,
                isActive ? styles.textActive : styles.textInactive,
              ]}
            >
              {val}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    top: 3,
    left: 3,
    height: 31,
    borderRadius: 6,
    backgroundColor: '#D87C24',
    zIndex: 1,
  },
  button: {
    flex: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  textInactive: {
    color: '#D87C24',
    fontFamily: 'Satoshi-Medium',
    fontWeight: '600',
  },
});
