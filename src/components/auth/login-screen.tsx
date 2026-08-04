import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { authService } from '@/utils/auth-service';
import ForgotPasswordModal from './forgot-password-modal';
import { SocialLoginButton } from './social-login-button';
import { useToast } from '@/components/ui/toast';

interface LoginScreenProps {
  onLogin: () => void;
  onSignUpPress: () => void;
}

export default function LoginScreen({ onLogin, onSignUpPress }: LoginScreenProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordVisible, setIsForgotPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both your email address and password.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      onLogin();
    } catch (error: any) {
      showToast(
        error.message || 'Incorrect email or password. Please verify your credentials and try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordVisible(true);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/signup_bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />

        <SafeAreaView style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Welcome back to {'\n'}
            <Text style={styles.brandAccent}>Buildsure</Text>
          </Text>
        </SafeAreaView>
      </ImageBackground>

      {/* Main White/Cream Form Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
            <Text style={styles.signUpLink} onPress={onSignUpPress}>
              Sign Up
            </Text>
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <SocialLoginButton provider="google" action="signin" />
            <SocialLoginButton provider="apple" action="signin" />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or Sign in using Email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Email address"
                placeholderTextColor="#A0A5B0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#A0A5B0"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeIcon}
                >
                  <SymbolView
                    name={{
                      ios: isPasswordVisible ? 'eye.fill' : 'eye.slash.fill',
                      android: isPasswordVisible ? 'visibility' : 'visibility_off',
                      web: isPasswordVisible ? 'visibility' : 'visibility_off',
                    }}
                    size={20}
                    tintColor="#8A8D93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Action Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Terms notice */}
          <Text style={styles.termsText}>
            By signing in, you agree to Buildsure's{' '}
            <Text style={styles.underline}>Terms of Use</Text> and{' '}
            <Text style={styles.underline}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Recovery Sheet */}
      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        onClose={() => setIsForgotPasswordVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1012',
  },
  headerBackground: {
    height: 250,
    width: '100%',
    justifyContent: 'flex-start',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 12 : 24,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Regular',
    color: '#FFFFFF',
    fontSize: 34,
    paddingTop: Platform.OS === 'ios' ? 50 : 90,
    lineHeight: 42,
  },
  brandAccent: {
    color: '#FFA726', // Orange Accent
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FEFAF4', // Soft Cream background
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // marginTop: -20,
    overflow: 'hidden',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  signUpText: {
    fontFamily: 'Satoshi-Regular',
    color: '#6C757D',
    fontSize: 14,
  },
  signUpLink: {
    fontFamily: 'Satoshi-Medium',
    color: '#D87C24',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#EBE6DC',
  },
  dividerText: {
    fontFamily: 'Satoshi-Medium',
    color: '#D87C24',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  formFields: {
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    gap: 6,
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
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingRight: 12,
  },
  passwordInput: {
    fontFamily: 'Satoshi-Regular',
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D87C24',
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loginButton: {
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
    lineHeight: 16,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
