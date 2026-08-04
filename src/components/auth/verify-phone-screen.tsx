import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from './back-button';
import { PhoneIllustration } from './phone-illustration';
import { setUserPhone } from '@/utils/user-store';
import { authService } from '@/utils/auth-service';
import { useToast } from '@/components/ui/toast';

interface VerifyPhoneScreenProps {
  onBack: () => void;
  onVerify: (phoneNumber: string, userId: string) => void;
  signUpData: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
  };
}

export default function VerifyPhoneScreen({ onBack, onVerify, signUpData }: VerifyPhoneScreenProps) {
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const countryCode = '+234';

  const handleVerify = async () => {
    if (!phoneNumber.trim()) return;
    
    // Normalize phone number (e.g. if user entered 08012345678, strip the leading 0)
    let cleanPhone = phoneNumber.trim();
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    const fullNumber = `${countryCode}${cleanPhone}`;
    
    setIsLoading(true);
    try {
      // Call real signup endpoint
      const userId = await authService.signUp({
        ...signUpData,
        phoneNumber: fullNumber,
      });
      
      setUserPhone(fullNumber);
      onVerify(fullNumber, userId);
    } catch (error: any) {
      showToast(
        error.message || 'An error occurred during account creation. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !phoneNumber.trim() || phoneNumber.length < 7 || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <View style={styles.header}>
            <BackButton onPress={onBack} />
          </View>

          {/* Phone Illustration Badge */}
          <View style={styles.illustrationWrapper}>
            <PhoneIllustration />
          </View>

          {/* Text Headers */}
          <View style={styles.textWrapper}>
            <Text style={styles.title}>Enter your Phone Number</Text>
            <Text style={styles.subtitle}>We will verify this phone</Text>
          </View>

          {/* Side-by-Side Input Row */}
          <View style={styles.inputRow}>
            {/* Country Picker Box */}
            <TouchableOpacity style={styles.countryPicker} activeOpacity={0.7}>
              <Text style={styles.flag}>🇳🇬</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
              <SymbolView
                name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                size={12}
                tintColor="#8A8D93"
              />
            </TouchableOpacity>

            {/* Phone Number TextInput Box */}
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter Phone Number"
                placeholderTextColor="#A0A5B0"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                autoFocus
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isButtonDisabled && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Phone Number</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4', // Soft cream background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  illustrationWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  phoneInputContainer: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  phoneInput: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    color: '#1A1C1E',
    width: '100%',
    height: '100%',
  },
  verifyButton: {
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
    marginTop: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
