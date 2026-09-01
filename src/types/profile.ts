export interface NotificationPreferences {
  loginAlertsEmail?: boolean;
  propertyAlertsEmail?: boolean;
  propertyAlertsPush?: boolean;
}

export interface BankAccount {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface FullUserProfile {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  role?: string;
  profileCompletionStep?: string;
  emailNotificationsEnabled?: boolean;
  notificationPreferences?: NotificationPreferences;
  bankAccount?: BankAccount | null;
  createdAt?: string;
}

export interface ProfileCompletionStep {
  key: string;
  label: string;
  done: boolean;
}

export interface ProfileCompletionData {
  steps: ProfileCompletionStep[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}

export interface BankReferenceItem {
  name: string;
  code: string;
}

export interface WalletData {
  balance: number;
  bankEarnings: number;
  currency: string;
}

export type WalletTransactionType = 'rent' | 'custom_fee' | 'admin_fee' | 'payout' | string;
export type WalletTransactionStatus = 'pending' | 'success' | 'failed' | string;

export interface WalletTransactionItem {
  id: string;
  type: WalletTransactionType;
  direction: 'credit' | 'debit' | string;
  status: WalletTransactionStatus;
  amount: number;
  breakdown?: any;
  reference: string;
  description?: string;
  tenancyId?: string;
  createdAt: string;
}

export interface WithdrawalResponse {
  reference: string;
  amount: number;
  status: string;
  newBalance: number;
}
