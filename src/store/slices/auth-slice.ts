import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, authService } from '@/utils/auth-service';
import { profileService } from '@/utils/profile-service';
import { FullUserProfile } from '@/types/profile';

export interface AuthState {
  user: UserProfile | FullUserProfile | null;
  profile: FullUserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  token: null,
  isAuthenticated: false,
  status: 'idle',
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
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.user = action.payload;
      });
  },
});

export const { setAuthUser, logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
