import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'auto' | 'dark' | 'light';
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * Standard Screen component maintaining safe areas (Dynamic Island, notch, status bar, navigation bar)
 * consistently throughout the entire application.
 */
export function AppScreen({
  children,
  style,
  backgroundColor = '#FEFAF4',
  edges = ['top', 'left', 'right'],
  statusBarStyle = 'dark',
  pointerEvents,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  const isTopEdge = edges.includes('top');
  const isBottomEdge = edges.includes('bottom');
  const isLeftEdge = edges.includes('left');
  const isRightEdge = edges.includes('right');

  // In modals on iOS, insets.top might report 0 or be un-injected,
  // so we ensure safe top padding for Dynamic Island / notch (minimum 44 on iOS, StatusBar height on Android)
  const topInset = isTopEdge
    ? Math.max(insets.top, Platform.OS === 'ios' ? 44 : (RNStatusBar.currentHeight || 24))
    : 0;

  const bottomInset = isBottomEdge
    ? Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12)
    : 0;

  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: topInset,
          paddingBottom: bottomInset,
          paddingLeft: isLeftEdge ? insets.left : 0,
          paddingRight: isRightEdge ? insets.right : 0,
        },
        style,
      ]}
    >
      <StatusBar style={statusBarStyle} />
      {children}
    </View>
  );
}

export default AppScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
