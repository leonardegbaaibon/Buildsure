import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppBottomSheet } from '../bottom-sheet';
import { BackButton } from './back-button';
import { PhoneIllustration } from './phone-illustration';
import { authService } from '@/utils/auth-service';
import { useToast } from '@/components/ui/toast';
import { AppScreen } from '@/components/ui/app-screen';

interface OtpScreenProps {
  phoneNumber: string;
  userId: string;
  onBack: () => void;
  onConfirm: () => void;
}

export default function OtpScreen({ phoneNumber, userId, onBack, onConfirm }: OtpScreenProps) {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [timer, setTimer] = useState(59);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Timer countdown logic
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authService.resendPhoneCode(userId);
      setTimer(59);
      setCode('');
      showToast('A new 6-digit code has been sent to your phone.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Could not resend verification code.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length === 6) {
      setIsLoading(true);
      try {
        await authService.verifyPhone(userId, code);
        setIsSheetVisible(true);
      } catch (error: any) {
        showToast(error.message || 'The verification code entered is incorrect.', 'error');
        setCode('');
      } finally {
        setIsLoading(false);
      }
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
        isCurrent && isFocused ? styles.otpBoxActive : null,
      ];

      boxes.push(
        <Pressable
          key={i}
          onPress={() => textInputRef.current?.focus()}
          style={boxStyle}
        >
          {char ? (
            <Text style={styles.otpText}>{char}</Text>
          ) : isCurrent && isFocused ? (
            <Text style={styles.cursor}>|</Text>
          ) : null}
        </Pressable>
      );
    }
    return boxes;
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        {/* Back Button */}
        <View style={styles.header}>
          <BackButton onPress={onBack} />
        </View>

        {/* Centered Phone Illustration */}
        <View style={styles.iconWrapper}>
          <PhoneIllustration />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textWrapper}>
          <Text style={styles.title}>Check your Phone!</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {phoneNumber || '+234 814 171 4124'}
          </Text>
        </View>

        {/* OTP Input Grid */}
        <View style={styles.otpGrid}>
          {renderOtpBoxes()}
        </View>

        {/* Hidden TextInput for keyboard input */}
        <TextInput
          ref={textInputRef}
          value={code}
          onChangeText={(val) => setCode(val.replace(/[^0-9]/g, ''))}
          maxLength={6}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          style={styles.hiddenInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Timer / Resend Row */}
        <View style={styles.timerContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resending in 0:{timer < 10 ? `0${timer}` : timer}
            </Text>
          ) : (
            <Text style={styles.resendPrompt}>
              Didn't receive a code?{' '}
              <Text onPress={handleResend} style={styles.resendLink}>
                Resend again
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.flexSpacer} />

        {/* Confirm Action Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (code.length < 6 || isLoading) && styles.confirmButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={code.length < 6 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Success Bottom Sheet Dialog */}
      <AppBottomSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
      >
        {/* Sunburst checkmark badge */}
        <View style={styles.successBadgeContainer}>
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
        </View>

        <Text style={styles.sheetTitle}>Sign up complete!</Text>
        <Text style={styles.sheetSubtitle}>
          Your account has been created successfully
        </Text>

        <TouchableOpacity
          style={styles.sheetButton}
          onPress={() => {
            setIsSheetVisible(false);
            onConfirm();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.sheetButtonText}>Proceed to sign in</Text>
        </TouchableOpacity>
      </AppBottomSheet>
    </AppScreen>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4', // Cream/Warm off-white background
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    marginTop: 36,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F5ECE1', // Warm light-orange cream circle background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE2D2',
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 36,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 10,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#D87C24', // Warm orange color for entered numbers
  },
  cursor: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 20,
    color: '#FFA726',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  timerText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  resendPrompt: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  resendLink: {
    fontFamily: 'Satoshi-Medium',
    color: '#D87C24',
    fontWeight: '600',
  },
  flexSpacer: {
    flex: 1,
  },
  confirmButton: {
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
  },
  successBadgeContainer: {
    marginBottom: 20,
  },
  successBadgeOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF3E0', // Light amber background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  successBadgeInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFA726', // Solid amber orange
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 8,
  },
  sheetButton: {
    height: 52,
    backgroundColor: '#FFA726',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 28,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sheetButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
