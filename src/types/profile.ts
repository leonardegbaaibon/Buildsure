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
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  role?: string;
  profileCompletionStep?: string;
  emailNotificationsEnabled?: boolean;
  notificationPreferences?: NotificationPreferences;
  bankAccount?: BankAccount;
  createdAt?: string;
}

export interface ProfileApiResponse {
  success: boolean;
  message: string;
  data: FullUserProfile;
}
