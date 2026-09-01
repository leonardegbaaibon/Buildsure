import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '../auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchBankAccount,
  linkBankAccount,
  removeBankAccount,
  fetchProfileCompletion,
} from '@/store/slices/auth-slice';
import { profileService } from '@/utils/profile-service';
import { BankReferenceItem } from '@/types/profile';

interface BankAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BankAccountModal({ visible, onClose }: BankAccountModalProps) {
  const dispatch = useAppDispatch();
  const bankAccount = useAppSelector((state) => state.auth.bankAccount);
  const isUpdatingBank = useAppSelector((state) => state.auth.isUpdatingBank);

  const [bankList, setBankList] = useState<BankReferenceItem[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankReferenceItem | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  useEffect(() => {
    if (visible) {
      dispatch(fetchBankAccount());
      loadBanks();
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (bankAccount) {
      setAccountNumber(bankAccount.accountNumber || '');
      setAccountName(bankAccount.accountName || '');
      if (bankAccount.bankName && bankAccount.bankCode) {
        setSelectedBank({
          name: bankAccount.bankName,
          code: bankAccount.bankCode,
        });
      }
    } else {
      setAccountNumber('');
      setAccountName('');
      setSelectedBank(null);
    }
  }, [bankAccount]);

  const loadBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const banks = await profileService.getReferenceBanks();
      setBankList(banks);
    } catch {
      // Handled in service fallback
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleLinkBank = async () => {
    if (!selectedBank) {
      CustomAlert.alert('Validation Error', 'Please select your bank.');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length !== 10 || !/^\d+$/.test(accountNumber.trim())) {
      CustomAlert.alert('Validation Error', 'Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    if (!accountName.trim()) {
      CustomAlert.alert('Validation Error', 'Please enter the account name.');
      return;
    }

    try {
      await dispatch(
        linkBankAccount({
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        })
      ).unwrap();

      dispatch(fetchProfileCompletion());
      CustomAlert.alert('Success', 'Bank account linked successfully.');
      onClose();
    } catch (err: any) {
      CustomAlert.alert('Linking Failed', err?.message || 'Could not link bank account.');
    }
  };

  const handleRemoveBank = () => {
    CustomAlert.alert(
      'Remove Bank Account',
      'Are you sure you want to remove your linked bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeBankAccount()).unwrap();
              dispatch(fetchProfileCompletion());
              CustomAlert.alert('Success', 'Bank account removed successfully.');
              onClose();
            } catch (err: any) {
              CustomAlert.alert('Error', err?.message || 'Could not remove bank account.');
            }
          },
        },
      ]
    );
  };

  const filteredBanks = bankList.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {bankAccount && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={handleRemoveBank}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Title */}
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Bank Account</Text>
              <Text style={styles.subtitle}>
                Link your commercial bank account for direct tenancy payouts and wallet withdrawals.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Bank Selection */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Bank Name</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  activeOpacity={0.8}
                  onPress={() => setIsBankPickerOpen(true)}
                >
                  <Text style={[styles.selectInputText, !selectedBank && styles.placeholderText]}>
                    {selectedBank ? selectedBank.name : 'Select bank'}
                  </Text>
                  <SymbolView
                    name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
                    size={16}
                    tintColor="#8A8D93"
                  />
                </TouchableOpacity>
              </View>

              {/* Account Number */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Account Number (10 digits)</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="0123456789"
                  placeholderTextColor="#A0A5B0"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              {/* Account Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Enter full account name"
                  placeholderTextColor="#A0A5B0"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Security note */}
            <View style={styles.securityNote}>
              <SymbolView
                name={{ ios: 'lock.shield.fill', android: 'security', web: 'security' }}
                size={16}
                tintColor="#D87C24"
              />
              <Text style={styles.securityText}>
                Account details are verified and securely processed via accredited financial gateways.
              </Text>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={handleLinkBank}
              disabled={isUpdatingBank}
            >
              {isUpdatingBank ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {bankAccount ? 'Update Bank Account' : 'Link Bank Account'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bank Picker Modal */}
        <Modal
          animationType="slide"
          visible={isBankPickerOpen}
          onRequestClose={() => setIsBankPickerOpen(false)}
        >
          <AppScreen edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.header}>
              <BackButton onPress={() => setIsBankPickerOpen(false)} />
              <Text style={styles.pickerHeaderTitle}>Select Bank</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={18}
                tintColor="#8A8D93"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search banks..."
                placeholderTextColor="#8A8D93"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {isLoadingBanks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D87C24" />
              </View>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.bankList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.bankRow,
                      selectedBank?.code === item.code && styles.bankRowSelected,
                    ]}
                    onPress={() => {
                      setSelectedBank(item);
                      setIsBankPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bankNameText,
                        selectedBank?.code === item.code && styles.bankNameTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedBank?.code === item.code && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={18}
                        tintColor="#D87C24"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </AppScreen>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE4E2',
  },
  removeBtnText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D92D20',
    fontWeight: '700',
  },
  titleWrapper: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  form: {
    gap: 20,
    marginBottom: 24,
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
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#1A1C1E',
    fontSize: 14,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBE6DC',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  selectInputText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  placeholderText: {
    color: '#A0A5B0',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 12,
    marginBottom: 32,
  },
  securityText: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  submitBtn: {
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
  submitBtnText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerHeaderTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE6DC',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  bankList: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  bankRowSelected: {
    backgroundColor: '#FFFDF9',
  },
  bankNameText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#1A1C1E',
  },
  bankNameTextSelected: {
    fontFamily: 'Satoshi-Bold',
    color: '#D87C24',
    fontWeight: '700',
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
});
