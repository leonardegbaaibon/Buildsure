import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService } from '@/utils/auth-service';
import { useToast } from '@/components/ui/toast';
import { setFlowState } from '@/utils/user-store';

// Configure Google Sign-In safely without throwing uncaught promise rejections on iOS
const initGoogleSignin = async () => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined;

  // On iOS, Google Sign-In requires an iOS client ID or GoogleService-Info.plist.
  // We avoid calling configure() until a client ID is provided.
  if (Platform.OS === 'ios' && !iosClientId) {
    return;
  }

  try {
    await GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: false,
    });
  } catch (err) {
    if (__DEV__) {
      console.warn('[GoogleSignin] Configuration initialization skipped:', err);
    }
  }
};

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  action: 'signin' | 'signup';
  style?: ViewStyle;
}

export function SocialLoginButton({ provider, action, style }: SocialLoginButtonProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(Platform.OS === 'ios');

  const isGoogle = provider === 'google';
  const label = action === 'signup'
    ? (isGoogle ? 'Sign up with Google' : 'Sign up with Apple')
    : (isGoogle ? 'Sign in with Google' : 'Sign in with Apple');

  useEffect(() => {
    if (isGoogle) {
      initGoogleSignin();
    } else if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable).catch(() => setIsAppleAvailable(false));
    }
  }, [isGoogle]);

  const handlePress = async () => {
    if (isLoading) return;

    if (isGoogle) {
      await handleGoogleSignIn();
    } else {
      await handleAppleSignIn();
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'ios' && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
        showToast(
          'Google Sign-In on iOS requires EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in your .env file or GoogleService-Info.plist.',
          'error'
        );
        setIsLoading(false);
        return;
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      
      const idToken = signInResult.data?.idToken || (signInResult as any).idToken;

      if (!idToken) {
        throw new Error('No Google ID token was returned.');
      }

      // Call POST /api/v1/auth/google
      const profile = await authService.signInWithGoogle(idToken);
      showToast('Successfully authenticated with Google!', 'success');

      // Newly created accounts or unverified phone accounts route to phone collection
      if (!profile.phoneNumber || !profile.isPhoneVerified) {
        setFlowState('verify-phone');
      } else {
        setFlowState('app');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow, no error needed
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast('Google Play Services is not available or outdated.', 'error');
        return;
      }

      const errorMessage =
        error.status === 429
          ? 'Too many requests. Please try again later.'
          : error.status === 401
          ? 'Invalid Google token. The token was rejected or expired.'
          : error.status === 400
          ? 'Google ID token is required.'
          : error.message || 'Google authentication failed. Please try again.';

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple.');
      }

      const givenName = credential.fullName?.givenName || undefined;
      const familyName = credential.fullName?.familyName || undefined;

      const profile = await authService.signInWithApple(
        credential.identityToken,
        givenName,
        familyName
      );

      showToast('Successfully authenticated with Apple!', 'success');

      if (!profile.phoneNumber || !profile.isPhoneVerified) {
        setFlowState('verify-phone');
      } else {
        setFlowState('app');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled Apple sign-in
        return;
      }

      showToast(
        error.message || 'Apple authentication failed. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isGoogle && !isAppleAvailable && Platform.OS !== 'ios') {
    // Hide Apple sign in button on non-supported platforms
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.socialButton, style, isLoading && styles.socialButtonDisabled]}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#1A1C1E" />
      ) : (
        <>
          {isGoogle ? (
            <FontAwesome name="google" size={18} color="#EA4335" style={styles.socialIcon} />
          ) : (
            <FontAwesome name="apple" size={20} color="#000000" style={styles.socialIcon} />
          )}
          <Text style={styles.socialButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    width: '100%',
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  socialIcon: {
    position: 'absolute',
    left: 20,
  },
  socialButtonText: {
    fontFamily: 'Satoshi-Medium',
    color: '#6C757D',
    fontSize: 14,
    fontWeight: '600',
  },
});
