/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1C1E',
    background: '#FEFAF4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAECEF',
    textSecondary: '#6C757D',
    brand: '#E65100', // Deep Orange/Amber
    brandLight: '#FFF3E0',
    success: '#2E7D32',
    successLight: '#E8F5E9',
    danger: '#D32F2F',
    dangerLight: '#FFEBEE',
    warning: '#F57C00',
    warningLight: '#FFF3E0',
    border: '#E0E0E0',
  },
  dark: {
    text: '#F8F9FA',
    background: '#0E1012', // Dark Charcoal
    backgroundElement: '#181A1E', // Dark Element Card
    backgroundSelected: '#2A2E35',
    textSecondary: '#9A9FA5',
    brand: '#FF9800', // Safety Amber
    brandLight: '#2D1F10',
    success: '#4CAF50',
    successLight: '#1B2E1C',
    danger: '#F44336',
    dangerLight: '#321B1B',
    warning: '#FFC107',
    warningLight: '#2E2713',
    border: '#2C3036',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
