import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { AppBottomSheet } from '../bottom-sheet';
import { authService } from '@/utils/auth-service';
import { useToast } from '@/components/ui/toast';
import { setFlowState } from '@/utils/user-store';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  action: 'signin' | 'signup';
  style?: ViewStyle;
}

export function SocialLoginButton({ provider, action, style }: SocialLoginButtonProps) {
  const { showToast } = useToast();
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulated form inputs for OAuth testing
  const isGoogle = provider === 'google';
  const defaultToken = isGoogle ? 'staging-google-id-token-xyz123' : 'staging-apple-identity-token-abc789';
  const [token, setToken] = useState(defaultToken);
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');

  const label = action === 'signup' 
    ? (isGoogle ? 'Sign up with Google' : 'Sign up with Apple')
    : (isGoogle ? 'Sign in with Google' : 'Sign in with Apple');

  const handleOAuthPress = () => {
    setIsSheetVisible(true);
  };

  const handleAuthenticate = async () => {
    if (!token.trim()) {
      showToast('Please enter a token to authenticate.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isGoogle) {
        // Calls POST /auth/google with { idToken: string }
        const profile = await authService.signInWithGoogle(token.trim());
        showToast('Successfully authenticated with Google!', 'success');
        setIsSheetVisible(false);

        // Client requirement: Newly created accounts (or accounts without phone/unverified phone)
        // route into phone collection. Existing linked accounts with verified phone enter the app.
        if (!profile.phoneNumber || !profile.isPhoneVerified) {
          setFlowState('verify-phone');
        } else {
          setFlowState('app');
        }
      } else {
        // Calls POST /auth/apple
        const profile = await authService.signInWithApple(token.trim(), firstName.trim(), lastName.trim());
        showToast('Successfully authenticated with Apple!', 'success');
        setIsSheetVisible(false);

        if (!profile.phoneNumber || !profile.isPhoneVerified) {
          setFlowState('verify-phone');
        } else {
          setFlowState('app');
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.status === 429
          ? 'Too many requests. Please try again later.'
          : error.status === 401
          ? 'Invalid Google token. The token was rejected or expired.'
          : error.status === 400
          ? 'Google ID token is required.'
          : error.message || 'Authentication failed. Please check your token and try again.';

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.socialButton, style]} 
        activeOpacity={0.8}
        onPress={handleOAuthPress}
      >
        {isGoogle ? (
          <FontAwesome name="google" size={18} color="#EA4335" style={styles.socialIcon} />
        ) : (
          <FontAwesome name="apple" size={20} color="#000000" style={styles.socialIcon} />
        )}
        <Text style={styles.socialButtonText}>{label}</Text>
      </TouchableOpacity>

      {/* Social Auth Staging Simulator Sheet */}
      <AppBottomSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        showGlowBackground={true}
        title={isGoogle ? "Google Sign In" : "Apple Sign In"}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetSubtitle}>
            OAuth credentials simulation for testing the backend server API integration.
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {isGoogle ? 'idToken' : 'identityToken'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isGoogle ? 'Enter idToken' : 'Enter identityToken'}
              placeholderTextColor="#A0A5B0"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {!isGoogle && (
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#A0A5B0"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#A0A5B0"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.authButton, isLoading && styles.authButtonDisabled]}
            onPress={handleAuthenticate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.authButtonText}>
                Authenticate with {isGoogle ? 'Google' : 'Apple'} API
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </AppBottomSheet>
    </>
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
  sheetContent: {
    width: '100%',
    gap: 16,
    paddingTop: 8,
  },
  sheetSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 8,
  },
  fieldContainer: {
    gap: 6,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 48,
    backgroundColor: '#FFFDF9',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
    width: '100%',
  },
  authButton: {
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    width: '100%',
  },
  authButtonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  authButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
