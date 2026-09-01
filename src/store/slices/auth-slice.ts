import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, authService } from '@/utils/auth-service';
import { profileService } from '@/utils/profile-service';
import {
  FullUserProfile,
  ProfileCompletionData,
  BankAccount,
  WalletData,
  NotificationPreferences,
  WithdrawalResponse,
} from '@/types/profile';

export interface AuthState {
  user: UserProfile | FullUserProfile | null;
  profile: FullUserProfile | null;
  completion: ProfileCompletionData | null;
  bankAccount: BankAccount | null;
  wallet: WalletData | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isUpdatingProfile: boolean;
  isUpdatingBank: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  completion: null,
  bankAccount: null,
  wallet: null,
  token: null,
  isAuthenticated: false,
  status: 'idle',
  isUpdatingProfile: false,
  isUpdatingBank: false,
  error: null,
};

export const checkAuthSession = createAsyncThunk<UserProfile | null>(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await authService.checkSession();
      return profile;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Session recovery failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk<FullUserProfile>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profileData = await profileService.getProfile();
      return profileData;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  FullUserProfile,
  { firstName?: string; middleName?: string | null; lastName?: string; phoneNumber?: string }
>('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const updated = await profileService.updateProfile(payload);
    return updated;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update profile');
  }
});

export const updateProfileAvatar = createAsyncThunk<
  string,
  { uri: string; name?: string; type?: string }
>('auth/updateProfileAvatar', async (file, { rejectWithValue }) => {
  try {
    const pictureUrl = await profileService.updateProfilePicture(
      file.uri,
      file.name || 'avatar.jpg',
      file.type || 'image/jpeg'
    );
    return pictureUrl;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update profile picture');
  }
});

export const fetchProfileCompletion = createAsyncThunk<ProfileCompletionData>(
  'auth/fetchCompletion',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profileService.getProfileCompletion();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch profile completion');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk<
  NotificationPreferences,
  NotificationPreferences
>('auth/updateNotificationPreferences', async (prefs, { rejectWithValue }) => {
  try {
    const data = await profileService.updateNotificationPreferences(prefs);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update notification preferences');
  }
});

export const updateEmailNotifications = createAsyncThunk<boolean, boolean>(
  'auth/updateEmailNotifications',
  async (enabled, { rejectWithValue }) => {
    try {
      const data = await profileService.updateEmailNotifications(enabled);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update email notifications');
    }
  }
);

export const fetchBankAccount = createAsyncThunk<BankAccount | null>(
  'auth/fetchBankAccount',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profileService.getBankAccount();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bank account');
    }
  }
);

export const linkBankAccount = createAsyncThunk<
  BankAccount,
  { bankName: string; bankCode: string; accountNumber: string; accountName: string }
>('auth/linkBankAccount', async (payload, { rejectWithValue }) => {
  try {
    const data = await profileService.linkBankAccount(payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to link bank account');
  }
});

export const removeBankAccount = createAsyncThunk<void>(
  'auth/removeBankAccount',
  async (_, { rejectWithValue }) => {
    try {
      await profileService.removeBankAccount();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove bank account');
    }
  }
);

export const fetchWallet = createAsyncThunk<WalletData>(
  'auth/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profileService.getWallet();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch wallet');
    }
  }
);

export const sendEmailVerificationOtp = createAsyncThunk<void, string>(
  'auth/sendEmailVerificationOtp',
  async (email, { rejectWithValue }) => {
    try {
      await authService.sendEmailVerificationOtp(email);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to send verification OTP');
    }
  }
);

export const verifyEmailOtp = createAsyncThunk<
  void,
  { code: string; email?: string }
>('auth/verifyEmailOtp', async ({ code, email }, { rejectWithValue, dispatch }) => {
  try {
    await authService.verifyEmailOtp(code, email);
    // Refresh user profile and completion
    dispatch(fetchUserProfile());
    dispatch(fetchProfileCompletion());
  } catch (err: any) {
    return rejectWithValue(err.message || 'Invalid or expired verification code');
  }
});

export const withdrawWallet = createAsyncThunk<WithdrawalResponse, number>(
  'auth/withdrawWallet',
  async (amount, { rejectWithValue }) => {
    try {
      const data = await profileService.withdrawFunds(amount);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to process withdrawal');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<{ user: UserProfile | FullUserProfile; token?: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
      state.status = 'succeeded';
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.completion = null;
      state.bankAccount = null;
      state.wallet = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      authService.signOut();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // checkAuthSession
    builder
      .addCase(checkAuthSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuthSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // fetchUserProfile
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.profile = action.payload;
      state.user = action.payload;
      if (action.payload.bankAccount) {
        state.bankAccount = action.payload.bankAccount;
      }
    });

    // updateUserProfile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdatingProfile = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.profile = { ...state.profile, ...action.payload };
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.error = action.payload as string;
      });

    // updateProfileAvatar
    builder.addCase(updateProfileAvatar.fulfilled, (state, action) => {
      if (state.profile) {
        state.profile.profilePicture = action.payload;
      }
      if (state.user) {
        state.user.profilePicture = action.payload;
      }
    });

    // fetchProfileCompletion
    builder.addCase(fetchProfileCompletion.fulfilled, (state, action) => {
      state.completion = action.payload;
    });

    // updateNotificationPreferences
    builder.addCase(updateNotificationPreferences.fulfilled, (state, action) => {
      if (state.profile) {
        state.profile.notificationPreferences = {
          ...state.profile.notificationPreferences,
          ...action.payload,
        };
      }
    });

    // updateEmailNotifications
    builder.addCase(updateEmailNotifications.fulfilled, (state, action) => {
      if (state.profile) {
        state.profile.emailNotificationsEnabled = action.payload;
      }
    });

    // fetchBankAccount
    builder.addCase(fetchBankAccount.fulfilled, (state, action) => {
      state.bankAccount = action.payload;
      if (state.profile) {
        state.profile.bankAccount = action.payload;
      }
    });

    // linkBankAccount
    builder
      .addCase(linkBankAccount.pending, (state) => {
        state.isUpdatingBank = true;
      })
      .addCase(linkBankAccount.fulfilled, (state, action) => {
        state.isUpdatingBank = false;
        state.bankAccount = action.payload;
        if (state.profile) {
          state.profile.bankAccount = action.payload;
        }
      })
      .addCase(linkBankAccount.rejected, (state, action) => {
        state.isUpdatingBank = false;
        state.error = action.payload as string;
      });

    // removeBankAccount
    builder.addCase(removeBankAccount.fulfilled, (state) => {
      state.bankAccount = null;
      if (state.profile) {
        state.profile.bankAccount = null;
      }
    });

    // fetchWallet
    builder.addCase(fetchWallet.fulfilled, (state, action) => {
      state.wallet = action.payload;
    });

    // withdrawWallet
    builder.addCase(withdrawWallet.fulfilled, (state, action) => {
      if (state.wallet) {
        state.wallet.balance = action.payload.newBalance;
      }
    });

    // verifyEmailOtp
    builder.addCase(verifyEmailOtp.fulfilled, (state) => {
      if (state.profile) {
        state.profile.isEmailVerified = true;
      }
      if (state.user) {
        state.user.isEmailVerified = true;
      }
    });
  },
});

export const { setAuthUser, logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
