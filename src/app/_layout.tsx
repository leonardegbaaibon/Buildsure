import React, { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import OnboardingFlow from '@/components/auth/onboarding-flow';
import SignUpScreen from '@/components/auth/signup-screen';
import OtpScreen from '@/components/auth/otp-screen';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [flowState, setFlowState] = useState<'onboarding' | 'signup' | 'otp' | 'app'>('onboarding');
  const [signUpPhone, setSignUpPhone] = useState('');

  const [fontsLoaded] = useFonts({
    'Satoshi-Black': require('../../assets/font/Satoshi-Black.otf'),
    'Satoshi-BlackItalic': require('../../assets/font/Satoshi-BlackItalic.otf'),
    'Satoshi-Bold': require('../../assets/font/Satoshi-Bold.otf'),
    'Satoshi-BoldItalic': require('../../assets/font/Satoshi-BoldItalic.otf'),
    'Satoshi-Italic': require('../../assets/font/Satoshi-Italic.otf'),
    'Satoshi-Light': require('../../assets/font/Satoshi-Light.otf'),
    'Satoshi-LightItalic': require('../../assets/font/Satoshi-LightItalic.otf'),
    'Satoshi-Medium': require('../../assets/font/Satoshi-Medium.otf'),
    'Satoshi-MediumItalic': require('../../assets/font/Satoshi-MediumItalic.otf'),
    'Satoshi-Regular': require('../../assets/font/Satoshi-Regular.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {flowState === 'onboarding' && (
          <OnboardingFlow onComplete={() => setFlowState('signup')} />
        )}
        {flowState === 'signup' && (
          <SignUpScreen
            onSignUp={(phone) => {
              setSignUpPhone(phone);
              setFlowState('otp');
            }}
            onLoginPress={() => setFlowState('app')}
          />
        )}
        {flowState === 'otp' && (
          <OtpScreen
            phoneNumber={signUpPhone}
            onBack={() => setFlowState('signup')}
            onConfirm={() => setFlowState('app')}
          />
        )}
        {flowState === 'app' && <AppTabs />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
