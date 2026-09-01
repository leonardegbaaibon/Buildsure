import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import OnboardingFlow from '@/components/auth/onboarding-flow';
import SignUpScreen from '@/components/auth/signup-screen';
import VerifyPhoneScreen from '@/components/auth/verify-phone-screen';
import OtpScreen from '@/components/auth/otp-screen';
import LoginScreen from '@/components/auth/login-screen';
import { getFlowState, subscribeFlowState, setFlowState as setGlobalFlowState, AppFlowState } from '@/utils/user-store';
import { authService } from '@/utils/auth-service';
import { storage } from '@/utils/storage';
import { ToastProvider } from '@/components/ui/toast';
import { AlertProvider } from '@/components/ui/custom-alert';

import { Provider } from 'react-redux';
import { store } from '@/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [flowState, setFlowStateInternal] = useState<AppFlowState>(getFlowState());
  const [signUpPhone, setSignUpPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [signUpDetails, setSignUpDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    // 1. Listen for user-store flow changes
    const unsubscribe = subscribeFlowState((state) => {
      setFlowStateInternal(state);
    });
    
    // 2. Perform automated session restoration & onboarding check on launch
    const restoreSession = async () => {
      const profile = await authService.checkSession();
      if (profile) {
        setGlobalFlowState('app');
        return;
      }

      // Check if user has already completed onboarding
      const hasSeenOnboarding = await storage.getItem('has_seen_onboarding');
      if (hasSeenOnboarding === 'true') {
        setGlobalFlowState('login');
      } else {
        setGlobalFlowState('onboarding');
      }
    };
    restoreSession();

    return unsubscribe;
  }, []);

  const setFlowState = (state: AppFlowState) => {
    setGlobalFlowState(state);
  };

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
    <Provider store={store}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ToastProvider>
              <AlertProvider>
                <AnimatedSplashOverlay />
                {flowState === 'onboarding' && (
                  <OnboardingFlow
                    onComplete={async () => {
                      await storage.setItem('has_seen_onboarding', 'true');
                      setFlowState('signup');
                    }}
                  />
                )}
                {flowState === 'signup' && (
                  <SignUpScreen
                    onSignUp={(data) => {
                      setSignUpDetails({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        password: data.password || '',
                      });
                      setFlowState('verify-phone');
                    }}
                    onLoginPress={() => setFlowState('login')}
                  />
                )}
                {flowState === 'login' && (
                  <LoginScreen
                    onLogin={() => setFlowState('app')}
                    onSignUpPress={() => setFlowState('signup')}
                  />
                )}
                {flowState === 'verify-phone' && (
                  <VerifyPhoneScreen
                    signUpData={signUpDetails}
                    onBack={() => setFlowState('signup')}
                    onVerify={(phone, returnedUserId) => {
                      setSignUpPhone(phone);
                      setUserId(returnedUserId);
                      setFlowState('otp');
                    }}
                  />
                )}
                {flowState === 'otp' && (
                  <OtpScreen
                    phoneNumber={signUpPhone}
                    userId={userId}
                    onBack={() => setFlowState('verify-phone')}
                    onConfirm={() => setFlowState('login')}
                  />
                )}
                {flowState === 'app' && <AppTabs />}
              </AlertProvider>
            </ToastProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Provider>
  );
}
