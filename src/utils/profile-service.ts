import { api } from './api-client';
import { authService } from './auth-service';
import {
  FullUserProfile,
  ProfileCompletionData,
  BankAccount,
  BankReferenceItem,
  WalletData,
  WalletTransactionItem,
  WithdrawalResponse,
  NotificationPreferences,
} from '@/types/profile';

export const profileService = {
  /**
   * GET /api/v1/profile
   */
  async getProfile(customToken?: string | null): Promise<FullUserProfile> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<{ success: boolean; data: FullUserProfile }>('/profile', token);
      if (response && response.data) {
        return response.data;
      }
      return response as any;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getProfile error:', error.message);
      }
      throw error;
    }
  },

  /**
   * PUT /api/v1/profile
   */
  async updateProfile(
    payload: {
      firstName?: string;
      middleName?: string | null;
      lastName?: string;
      phoneNumber?: string;
    },
    customToken?: string | null
  ): Promise<FullUserProfile> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.put<{ success: boolean; message: string; data: FullUserProfile }>(
        '/profile',
        payload,
        token
      );
      if (response && response.data) {
        return response.data;
      }
      return response as any;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] updateProfile error:', error.message);
      }
      throw error;
    }
  },

  /**
   * PUT /api/v1/profile/picture
   * multipart/form-data, field: picture
   */
  async updateProfilePicture(
    fileUri: string,
    fileName: string = 'avatar.jpg',
    mimeType: string = 'image/jpeg',
    customToken?: string | null
  ): Promise<string> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const formData = new FormData();
      formData.append('picture', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const response = await api.putForm<{
        success: boolean;
        message: string;
        data: { profilePicture: string };
      }>('/profile/picture', formData, token);

      return response?.data?.profilePicture || '';
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] updateProfilePicture error:', error.message);
      }
      throw error;
    }
  },

  /**
   * GET /api/v1/profile/completion
   */
  async getProfileCompletion(customToken?: string | null): Promise<ProfileCompletionData> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<{ success: boolean; message: string; data: ProfileCompletionData }>(
        '/profile/completion',
        token
      );
      if (response && response.data) {
        return response.data;
      }
      return {
        steps: [],
        completedCount: 0,
        totalCount: 4,
        isComplete: false,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getProfileCompletion error:', error.message);
      }
      throw error;
    }
  },

  /**
   * PATCH /api/v1/profile/notifications
   */
  async updateEmailNotifications(
    enabled: boolean,
    customToken?: string | null
  ): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.patch<{
        success: boolean;
        message: string;
        data: { emailNotificationsEnabled: boolean };
      }>('/profile/notifications', { enabled }, token);
      return response?.data?.emailNotificationsEnabled ?? enabled;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] updateEmailNotifications error:', error.message);
      }
      throw error;
    }
  },

  /**
   * PATCH /api/v1/profile/notification-preferences
   */
  async updateNotificationPreferences(
    prefs: NotificationPreferences,
    customToken?: string | null
  ): Promise<NotificationPreferences> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.patch<{
        success: boolean;
        message: string;
        data: NotificationPreferences;
      }>('/profile/notification-preferences', prefs, token);
      return response?.data ?? prefs;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] updateNotificationPreferences error:', error.message);
      }
      throw error;
    }
  },

  /**
   * GET /api/v1/profile/bank-account
   */
  async getBankAccount(customToken?: string | null): Promise<BankAccount | null> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<{ success: boolean; message: string; data: BankAccount | null }>(
        '/profile/bank-account',
        token
      );
      return response?.data ?? null;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getBankAccount error:', error.message);
      }
      throw error;
    }
  },

  /**
   * POST /api/v1/profile/bank-account
   */
  async linkBankAccount(
    payload: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    },
    customToken?: string | null
  ): Promise<BankAccount> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.post<{ success: boolean; message: string; data: BankAccount }>(
        '/profile/bank-account',
        payload,
        token
      );
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] linkBankAccount error:', error.message);
      }
      throw error;
    }
  },

  /**
   * DELETE /api/v1/profile/bank-account
   */
  async removeBankAccount(customToken?: string | null): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.delete<{ success: boolean; message: string; data: { removed: boolean } }>(
        '/profile/bank-account',
        token
      );
      return response?.data?.removed ?? true;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] removeBankAccount error:', error.message);
      }
      throw error;
    }
  },

  /**
   * GET /api/v1/reference/banks (public, no auth required)
   */
  async getReferenceBanks(): Promise<BankReferenceItem[]> {
    try {
      const response = await api.get<{ success: boolean; message: string; data: BankReferenceItem[] }>(
        '/reference/banks'
      );
      return response?.data || [];
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getReferenceBanks error:', error.message);
      }
      return [
        { name: 'Access Bank', code: '044' },
        { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
        { name: 'First Bank of Nigeria', code: '011' },
        { name: 'United Bank for Africa (UBA)', code: '033' },
        { name: 'Zenith Bank', code: '057' },
        { name: 'Kuda Bank', code: '50211' },
        { name: 'OPay', code: '999992' },
        { name: 'Moniepoint', code: '50515' },
      ];
    }
  },

  /**
   * GET /api/v1/wallet
   */
  async getWallet(customToken?: string | null): Promise<WalletData> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<{ success: boolean; message: string; data: WalletData }>(
        '/wallet',
        token
      );
      return (
        response?.data || {
          balance: 0,
          bankEarnings: 0,
          currency: 'NGN',
        }
      );
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getWallet error:', error.message);
      }
      return {
        balance: 0,
        bankEarnings: 0,
        currency: 'NGN',
      };
    }
  },

  /**
   * GET /api/v1/wallet/transactions?type=&status=&limit=
   */
  async getWalletTransactions(
    params?: { type?: string; status?: string; limit?: number },
    customToken?: string | null
  ): Promise<WalletTransactionItem[]> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.status) query.append('status', params.status);
      if (params?.limit) query.append('limit', String(params.limit));

      const endpoint = `/wallet/transactions${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await api.get<{ success: boolean; message: string; data: WalletTransactionItem[] }>(
        endpoint,
        token
      );
      return response?.data || [];
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] getWalletTransactions error:', error.message);
      }
      return [];
    }
  },

  /**
   * POST /api/v1/wallet/withdraw
   */
  async withdrawFunds(
    amount: number,
    customToken?: string | null
  ): Promise<WithdrawalResponse> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.post<{ success: boolean; message: string; data: WithdrawalResponse }>(
        '/wallet/withdraw',
        { amount },
        token
      );
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] withdrawFunds error:', error.message);
      }
      throw error;
    }
  },
};
