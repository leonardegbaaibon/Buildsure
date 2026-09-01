import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BackButton } from '../auth/back-button';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AppScreen } from '@/components/ui/app-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWallet, withdrawWallet } from '@/store/slices/auth-slice';
import { profileService } from '@/utils/profile-service';
import { WalletTransactionItem } from '@/types/profile';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenBankModal?: () => void;
}

export default function WalletModal({ visible, onClose, onOpenBankModal }: WalletModalProps) {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.auth.wallet);
  const bankAccount = useAppSelector((state) => state.auth.bankAccount);

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (visible) {
      dispatch(fetchWallet());
      loadTransactions();
    }
  }, [visible, dispatch]);

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const txs = await profileService.getWalletTransactions({ limit: 50 });
      setTransactions(txs);
    } catch {
      // Handled in service fallback
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const balance = wallet?.balance ?? 0;
  const bankEarnings = wallet?.bankEarnings ?? 0;
  const currency = wallet?.currency ?? 'NGN';

  const handleWithdraw = async () => {
    const numericAmount = Number(withdrawAmount.replace(/[^0-9.]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      CustomAlert.alert('Validation Error', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (numericAmount > balance) {
      CustomAlert.alert('Insufficient Balance', `You cannot withdraw more than your current balance of ₦${balance.toLocaleString()}.`);
      return;
    }
    if (!bankAccount?.accountNumber) {
      CustomAlert.alert(
        'Bank Account Required',
        'Please link your bank account before requesting a withdrawal.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Link Bank',
            onPress: () => {
              setIsWithdrawModalOpen(false);
              onClose();
              if (onOpenBankModal) onOpenBankModal();
            },
          },
        ]
      );
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await dispatch(withdrawWallet(numericAmount)).unwrap();
      setIsWithdrawing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      dispatch(fetchWallet());
      loadTransactions();
      CustomAlert.alert(
        'Withdrawal Initiated',
        `Withdrawal of ₦${numericAmount.toLocaleString()} has been queued (Ref: ${res.reference}). Status: ${res.status}.`
      );
    } catch (err: any) {
      setIsWithdrawing(false);
      CustomAlert.alert('Withdrawal Failed', err?.message || 'Could not process withdrawal. Please try again later.');
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onClose} />
            <Text style={styles.headerTitle}>BuildSure Wallet</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Balance Banner Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>WITHDRAWABLE BALANCE</Text>
            <Text style={styles.balanceAmount}>
              ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.currencyCode}>{currency}</Text>

            <View style={styles.cardStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Bank Earnings</Text>
                <Text style={styles.statValue}>₦{bankEarnings.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.withdrawActionBtn, balance <= 0 && styles.withdrawActionBtnDisabled]}
              activeOpacity={0.8}
              onPress={() => setIsWithdrawModalOpen(true)}
              disabled={balance <= 0}
            >
              <SymbolView
                name={{ ios: 'arrow.up.right.circle.fill', android: 'arrow_outward', web: 'arrow_outward' }}
                size={18}
                tintColor={balance > 0 ? '#FFFFFF' : '#8A8D93'}
              />
              <Text style={[styles.withdrawActionText, balance <= 0 && styles.withdrawActionTextDisabled]}>
                Withdraw Funds
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transactions Header */}
          <View style={styles.txHeaderRow}>
            <Text style={styles.txSectionTitle}>Transaction History</Text>
            <TouchableOpacity onPress={loadTransactions} activeOpacity={0.7}>
              <SymbolView
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                size={16}
                tintColor="#D87C24"
              />
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={styles.txLoadingBox}>
              <ActivityIndicator size="small" color="#D87C24" />
            </View>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => {
              const isCredit = tx.direction === 'credit' || tx.type === 'rent';
              return (
                <View key={tx.id || tx.reference} style={styles.txCard}>
                  <View style={[styles.txIconCircle, isCredit ? styles.creditBg : styles.debitBg]}>
                    <SymbolView
                      name={{
                        ios: isCredit ? 'arrow.down.left' : 'arrow.up.right',
                        android: isCredit ? 'arrow_downward' : 'arrow_upward',
                        web: isCredit ? 'arrow_downward' : 'arrow_upward',
                      }}
                      size={18}
                      tintColor={isCredit ? '#039855' : '#D92D20'}
                    />
                  </View>

                  <View style={styles.txDetailsCol}>
                    <Text style={styles.txDescription} numberOfLines={1}>
                      {tx.description || `${tx.type.toUpperCase()} transaction`}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'} • {tx.status}
                    </Text>
                  </View>

                  <Text style={[styles.txAmount, isCredit ? styles.creditText : styles.debitText]}>
                    {isCredit ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTxBox}>
              <SymbolView
                name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
                size={40}
                tintColor="#EBE6DC"
              />
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          )}
        </ScrollView>

        {/* Withdrawal Bottom/Input Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isWithdrawModalOpen}
          onRequestClose={() => setIsWithdrawModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalDialog}>
              <Text style={styles.dialogTitle}>Withdraw to Bank</Text>
              <Text style={styles.dialogSub}>
                Destination: {bankAccount ? `${bankAccount.bankName} (••••${(bankAccount.accountNumber || '').slice(-4)})` : 'No bank linked'}
              </Text>

              <View style={styles.amountInputContainer}>
                <Text style={styles.nairaPrefix}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#A0A5B0"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  autoFocus={true}
                />
              </View>

              <Text style={styles.availableBalanceNote}>
                Available to withdraw: ₦{balance.toLocaleString()}
              </Text>

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.cancelDialogBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsWithdrawModalOpen(false)}
                >
                  <Text style={styles.cancelDialogText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDialogBtn}
                  activeOpacity={0.8}
                  onPress={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmDialogText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  scrollContent: {
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
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  balanceCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    padding: 20,
    marginBottom: 28,
  },
  balanceLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '800',
    color: '#D87C24',
  },
  currencyCode: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#8A8D93',
    marginTop: 2,
    marginBottom: 16,
  },
  cardStatsRow: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  statBox: {
    gap: 2,
  },
  statLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  statValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#1A1C1E',
    fontWeight: '700',
  },
  withdrawActionBtn: {
    height: 48,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawActionBtnDisabled: {
    backgroundColor: '#EBE6DC',
  },
  withdrawActionText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  withdrawActionTextDisabled: {
    color: '#8A8D93',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  txSectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  txLoadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EDE6',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditBg: {
    backgroundColor: '#EBFDF2',
  },
  debitBg: {
    backgroundColor: '#FEE4E2',
  },
  txDetailsCol: {
    flex: 1,
  },
  txDescription: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#1A1C1E',
    fontWeight: '700',
    marginBottom: 2,
  },
  txDate: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
  },
  txAmount: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  creditText: {
    color: '#039855',
  },
  debitText: {
    color: '#D92D20',
  },
  emptyTxBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTxText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#8A8D93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  dialogTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  dialogSub: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#EBE6DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  nairaPrefix: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#D87C24',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#1A1C1E',
  },
  availableBalanceNote: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#8A8D93',
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDialogBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelDialogText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#6C757D',
  },
  confirmDialogBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialogText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
