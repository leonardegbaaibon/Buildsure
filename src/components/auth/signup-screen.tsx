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
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { FontAwesome } from '@expo/vector-icons';
import { setUserName, setUserPhone } from '@/utils/user-store';

interface SignUpScreenProps {
  onSignUp: (phoneNumber: string) => void;
  onLoginPress?: () => void;
}

export default function SignUpScreen({ onSignUp, onLoginPress }: SignUpScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Real-time password validation logic
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSignUp = () => {
    // Basic validation
    if (!firstName || !lastName || !email || !phoneNumber || !isPasswordValid) {
      alert('Please fill in all fields correctly');
      return;
    }
    // Save to global user store
    setUserName(`${firstName} ${lastName}`);
    setUserPhone(phoneNumber);
    // Proceed to OTP layout passing user phone number
    onSignUp(phoneNumber);
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
            Get Started with {'\n'}
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
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={onLoginPress}>
              Login
            </Text>
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="google" size={18} color="#EA4335" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="apple" size={20} color="#000000" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or Sign up using Email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formGrid}>
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  placeholderTextColor="#A0A5B0"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  placeholderTextColor="#A0A5B0"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

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
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                {/* Country Code Picker mockup */}
                <TouchableOpacity style={styles.countryPicker} activeOpacity={0.7}>
                  <Text style={styles.flag}>🇳🇬</Text>
                  <Text style={styles.countryCode}>+234</Text>
                  <SymbolView
                    name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                    size={12}
                    tintColor="#8A8D93"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter Phone Number"
                  placeholderTextColor="#A0A5B0"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
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
                      ios: isPasswordVisible ? 'eye.slash' : 'eye',
                      android: isPasswordVisible ? 'visibility_off' : 'visibility',
                      web: isPasswordVisible ? 'visibility_off' : 'visibility'
                    }}
                    size={20}
                    tintColor="#8A8D93"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Validation Checklist */}
              {password.length > 0 && (
                <View style={styles.validationContainer}>
                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: hasLowercase ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: hasLowercase ? 'check_circle' : 'cancel',
                        web: hasLowercase ? 'check_circle' : 'cancel'
                      }}
                      size={16}
                      tintColor={hasLowercase ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, hasLowercase && styles.validationTextActive]}>
                      One lowercase character
                    </Text>
                  </View>

                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: hasSpecial ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: hasSpecial ? 'check_circle' : 'cancel',
                        web: hasSpecial ? 'check_circle' : 'cancel'
                      }}
                      size={16}
                      tintColor={hasSpecial ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, hasSpecial && styles.validationTextActive]}>
                      One special character
                    </Text>
                  </View>

                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: hasUppercase ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: hasUppercase ? 'check_circle' : 'cancel',
                        web: hasUppercase ? 'check_circle' : 'cancel'
                      }}
                      size={16}
                      tintColor={hasUppercase ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, hasUppercase && styles.validationTextActive]}>
                      One uppercase character
                    </Text>
                  </View>

                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: isMinLength ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: isMinLength ? 'check_circle' : 'cancel',
                        web: isMinLength ? 'check_circle' : 'cancel'
                      }}
                      size={16}
                      tintColor={isMinLength ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, isMinLength && styles.validationTextActive]}>
                      8 minimum characters
                    </Text>
                  </View>

                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: hasNumber ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: hasNumber ? 'check_circle' : 'cancel',
                        web: hasNumber ? 'check_circle' : 'cancel'
                      }}
                      size={16}
                      tintColor={hasNumber ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, hasNumber && styles.validationTextActive]}>
                      One number
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!firstName || !lastName || !email || !phoneNumber || !isPasswordValid) && styles.submitButtonDisabled
            ]}
            onPress={handleSignUp}
            disabled={!firstName || !lastName || !email || !phoneNumber || !isPasswordValid}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Terms and Privacy Policy */}
          <Text style={styles.consentText}>
            By continuing, you agree to Buildsures'{' '}
            <Text style={styles.link}>Terms of Use</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FAF8F5', // Soft Cream background
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
  loginText: {
    fontFamily: 'Satoshi-Regular',
    color: '#6C757D',
    fontSize: 14,
  },
  loginLink: {
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
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontFamily: 'Satoshi-Medium',
    color: '#6C757D',
    fontSize: 14,
    fontWeight: '600',
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
  formGrid: {
    gap: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  phoneInputContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightColor: '#EBE6DC',
    borderRightWidth: 1,
    backgroundColor: '#F5F2EC',
    gap: 4,
  },
  flag: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
  },
  countryCode: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  phoneInput: {
    fontFamily: 'Satoshi-Regular',
    flex: 1,
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
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  consentText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    fontFamily: 'Satoshi-Medium',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 8,
    gap: 6,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  validationTextActive: {
    color: '#1A1C1E',
  },
});
