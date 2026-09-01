import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '../auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('Mybuildsureaccount21');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isOldVisible, setIsOldVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const handleSave = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      CustomAlert.alert('Validation Error', 'All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      CustomAlert.alert('Validation Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      CustomAlert.alert('Validation Error', 'New password must be at least 8 characters.');
      return;
    }
    CustomAlert.alert('Success', 'Password changed successfully.');
    onClose();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <BackButton onPress={onClose} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Change your password</Text>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Old Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Old Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!isOldVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setIsOldVisible(!isOldVisible)}
                    style={styles.eyeIcon}
                  >
                    <SymbolView
                      name={{
                        ios: isOldVisible ? 'eye.slash' : 'eye',
                        android: isOldVisible ? 'visibility_off' : 'visibility',
                        web: isOldVisible ? 'visibility_off' : 'visibility'
                      }}
                      size={20}
                      tintColor="#8A8D93"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!isNewVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setIsNewVisible(!isNewVisible)}
                    style={styles.eyeIcon}
                  >
                    <SymbolView
                      name={{
                        ios: isNewVisible ? 'eye.slash' : 'eye',
                        android: isNewVisible ? 'visibility_off' : 'visibility',
                        web: isNewVisible ? 'visibility_off' : 'visibility'
                      }}
                      size={20}
                      tintColor="#8A8D93"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                    style={styles.eyeIcon}
                  >
                    <SymbolView
                      name={{
                        ios: isConfirmVisible ? 'eye.slash' : 'eye',
                        android: isConfirmVisible ? 'visibility_off' : 'visibility',
                        web: isConfirmVisible ? 'visibility_off' : 'visibility'
                      }}
                      size={20}
                      tintColor="#8A8D93"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Changes button */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFAF4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 32,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  inputContainer: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
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
  saveBtn: {
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
  saveBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
