import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppBottomSheet } from '../bottom-sheet';
import { authService } from '@/utils/auth-service';
import { useToast } from '@/components/ui/toast';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'new-password' | 'success';

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  // Real-time password validation logic
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isMatch = password === confirmPassword && password.length > 0;

  // Code input focus management
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (visible) {
      setStep('email');
      setEmail('');
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
    }
  }, [visible]);

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep('code');
    } catch (error: any) {
      showToast(error.message || 'Could not send reset code. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 6) return;
    
    setIsLoading(true);
    try {
      const token = await authService.verifyResetCode(email.trim(), code);
      setResetToken(token);
      setStep('new-password');
    } catch (error: any) {
      showToast(error.message || 'Invalid reset code. Please try again.', 'error');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      showToast('Please satisfy all password complexity rules.', 'error');
      return;
    }
    if (!isMatch) {
      showToast('Confirm password does not match.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(resetToken, password);
      setStep('success');
    } catch (error: any) {
      showToast(error.message || 'Could not reset password. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = code[i] || '';
      const isCurrent = i === code.length;
      const boxStyle = [
        styles.otpBox,
        char ? styles.otpBoxFilled : null,
        isCurrent && isCodeFocused ? styles.otpBoxActive : null,
      ];

      boxes.push(
        <Pressable
          key={i}
          onPress={() => codeInputRef.current?.focus()}
          style={boxStyle}
        >
          {char ? (
            <Text style={styles.otpText}>{char}</Text>
          ) : isCurrent && isCodeFocused ? (
            <Text style={styles.cursor}>|</Text>
          ) : null}
        </Pressable>
      );
    }
    return boxes;
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      showGlowBackground={true}
    >
      <View style={styles.sheetContent}>
        
        {step === 'email' && (
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address to receive a 6-digit verification code.
            </Text>

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
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (!email.trim() || isLoading) && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={!email.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit reset code to <Text style={styles.boldText}>{email}</Text>.
            </Text>

            {/* OTP Input Grid */}
            <View style={styles.otpGrid}>
              {renderOtpBoxes()}
            </View>

            <TextInput
              ref={codeInputRef}
              value={code}
              onChangeText={(val) => setCode(val.replace(/[^0-9]/g, ''))}
              maxLength={6}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              onFocus={() => setIsCodeFocused(true)}
              onBlur={() => setIsCodeFocused(false)}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, (code.length < 6 || isLoading) && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={code.length < 6 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify Reset Code</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setStep('email')} 
              style={styles.backLink}
              disabled={isLoading}
            >
              <Text style={styles.backLinkText}>Back to Email Input</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'new-password' && (
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password containing at least 8 characters.
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#A0A5B0"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
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
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#A0A5B0"
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  style={styles.eyeIcon}
                >
                  <SymbolView
                    name={{
                      ios: isConfirmPasswordVisible ? 'eye.slash' : 'eye',
                      android: isConfirmPasswordVisible ? 'visibility_off' : 'visibility',
                      web: isConfirmPasswordVisible ? 'visibility_off' : 'visibility'
                    }}
                    size={20}
                    tintColor="#8A8D93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Validation Checklist */}
            {password.length > 0 && (
              <View style={styles.validationContainer}>
                <View style={styles.validationRow}>
                  <SymbolView
                    name={{
                      ios: hasLowercase ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                      android: hasLowercase ? 'check_circle' : 'cancel',
                      web: hasLowercase ? 'check_circle' : 'cancel'
                    }}
                    size={15}
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
                    size={15}
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
                    size={15}
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
                    size={15}
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
                    size={15}
                    tintColor={hasNumber ? '#0F9D58' : '#FDA29B'}
                  />
                  <Text style={[styles.validationText, hasNumber && styles.validationTextActive]}>
                    One number
                  </Text>
                </View>
                
                {confirmPassword.length > 0 && (
                  <View style={styles.validationRow}>
                    <SymbolView
                      name={{
                        ios: isMatch ? 'checkmark.circle.fill' : 'xmark.circle.fill',
                        android: isMatch ? 'check_circle' : 'cancel',
                        web: isMatch ? 'check_circle' : 'cancel'
                      }}
                      size={15}
                      tintColor={isMatch ? '#0F9D58' : '#FDA29B'}
                    />
                    <Text style={[styles.validationText, isMatch && styles.validationTextActive]}>
                      Passwords match
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!isPasswordValid || !isMatch || isLoading) && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={!isPasswordValid || !isMatch || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'success' && (
          <View style={[styles.innerContainer, { alignItems: 'center' }]}>
            <View style={styles.successBadgeOuter}>
              <View style={styles.successBadgeInner}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={28}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
              </View>
            </View>

            <Text style={styles.successTitle}>Password Updated!</Text>
            <Text style={styles.successSubtitle}>
              Your password has been reset successfully. You can now sign in with your new password.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    width: '100%',
    paddingTop: 8,
  },
  innerContainer: {
    width: '100%',
    gap: 16,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 8,
  },
  boldText: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#1A1C1E',
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
    backgroundColor: '#FFFDF9',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#FFFDF9',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
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
  button: {
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
  buttonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 12,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: '#EBE6DC',
  },
  otpBoxActive: {
    borderColor: '#FFA726',
    borderWidth: 2,
  },
  otpText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#D87C24',
  },
  cursor: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 18,
    color: '#FFA726',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  backLink: {
    alignSelf: 'center',
    padding: 8,
    marginTop: 4,
  },
  backLinkText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#D87C24',
    textDecorationLine: 'underline',
  },
  validationContainer: {
    gap: 6,
    marginTop: 4,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  validationTextActive: {
    color: '#1A1C1E',
  },
  successBadgeOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  successBadgeInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
});
