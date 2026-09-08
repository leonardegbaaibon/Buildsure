import { api, setStagingBearerToken } from './api-client';
import { storage } from './storage';
import { setUserName, setUserPhone } from './user-store';

const TOKEN_KEY = 'buildsure_auth_token';
const REFRESH_TOKEN_KEY = 'buildsure_refresh_token';
const USER_KEY = 'buildsure_auth_user';

export interface UserProfile {
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
  authProvider?: string;
  createdAt?: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password?: string;
}

export interface SignInResponse {
  success?: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserProfile;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: UserProfile;
  };
}

export interface SignUpResponse {
  userId?: string;
  id?: string;
  user?: {
    id: string;
  };
  data?: {
    userId?: string;
    id?: string;
    user?: {
      id: string;
    };
  };
}

export interface VerifyResetCodeResponse {
  resetToken?: string;
  token?: string;
  data?: {
    resetToken?: string;
    token?: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

export const authService = {
  /**
   * 1. Signup API
   */
  async signUp(payload: SignUpPayload): Promise<string> {
    const res = await api.post<SignUpResponse>('/auth/signup', payload);
    
    // Flexible extraction of userId from API response
    const userId = 
      res.userId || 
      res.id || 
      res.user?.id || 
      res.data?.userId || 
      res.data?.id || 
      res.data?.user?.id;
      
    if (!userId) {
      // In case api returns a plain object without id but succeeded
      throw new Error('Registration succeeded, but no user ID was returned by the server.');
    }
    
    return userId;
  },

  /**
   * 2. Verify Phone API
   */
  async verifyPhone(userId: string, code: string): Promise<any> {
    const res = await api.post<any>('/auth/verify-phone', { userId, code });
    const token = res.token || res.accessToken || res.data?.token || res.data?.accessToken;
    const refreshToken = res.refreshToken || res.data?.refreshToken;

    if (token) {
      await storage.setItem(TOKEN_KEY, token);
      setStagingBearerToken(token);
    }
    if (refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    return res;
  },

  /**
   * 3. Resend Phone Verification Code API
   */
  async resendPhoneCode(userId: string): Promise<any> {
    return await api.post('/auth/resend-phone-code', { userId });
  },

  /**
   * Send Email Verification OTP API
   */
  async sendEmailVerificationOtp(email: string): Promise<any> {
    try {
      const token = await this.getSessionToken();
      return await api.post('/auth/send-email-otp', { email }, token);
    } catch (err) {
      try {
        const token = await this.getSessionToken();
        return await api.post('/auth/verify-email/request', { email }, token);
      } catch (err2) {
        const token = await this.getSessionToken();
        return await api.post('/profile/verify-email/request', { email }, token);
      }
    }
  },

  /**
   * Verify Email OTP API
   */
  async verifyEmailOtp(code: string, email?: string): Promise<any> {
    try {
      const token = await this.getSessionToken();
      return await api.post('/auth/verify-email', { code, email }, token);
    } catch (err) {
      const token = await this.getSessionToken();
      return await api.post('/profile/verify-email', { code, email }, token);
    }
  },

  /**
   * 4. Forgot Password API
   */
  async forgotPassword(email: string): Promise<any> {
    return await api.post('/auth/forgot-password', { email });
  },

  /**
   * 5. Verify Password Reset Code API
   */
  async verifyResetCode(email: string, code: string): Promise<string> {
    const res = await api.post<VerifyResetCodeResponse>('/auth/verify-reset-code', { email, code });
    
    const resetToken = 
      res.resetToken || 
      res.token || 
      res.data?.resetToken || 
      res.data?.token;

    if (!resetToken) {
      throw new Error('Verification code accepted, but no reset token was returned.');
    }
    
    return resetToken;
  },

  /**
   * 6. Reset Password API
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<any> {
    return await api.post('/auth/reset-password', { resetToken, newPassword });
  },

  /**
   * 7. Signin API
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    const res = await api.post<SignInResponse>('/auth/signin', { email, password });
    
    // Extract token
    const token = 
      res.token || 
      res.accessToken || 
      res.data?.token || 
      res.data?.accessToken;

    const refreshToken = 
      res.refreshToken || 
      res.data?.refreshToken;
      
    // Extract user profile
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Login succeeded, but no access token was returned.');
    }
    
    // Save credentials to local persistent storage
    await storage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setStagingBearerToken(token);
    
    const profile: UserProfile = user || {
      id: '',
      firstName: email.split('@')[0],
      lastName: '',
      email,
    };
    
    await storage.setItem(USER_KEY, JSON.stringify(profile));
    
    // Update local user store
    setUserName(`${profile.firstName} ${profile.lastName}`.trim() || profile.email);
    if (profile.phoneNumber) {
      setUserPhone(profile.phoneNumber);
    }
    
    return profile;
  },

  /**
   * 8. Google Signin API
   * POST /api/v1/auth/google
   * Public route (no auth header). Rate limited: 20 reqs / 15 mins.
   * Body: { idToken: string }
   */
  async signInWithGoogle(idToken: string): Promise<UserProfile> {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Google ID token is required.');
    }

    const res = await api.post<SignInResponse>('/auth/google', { idToken });
    
    const token = 
      res.token || 
      res.accessToken || 
      res.data?.token || 
      res.data?.accessToken;

    const refreshToken = 
      res.refreshToken || 
      res.data?.refreshToken;
      
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Google authentication succeeded, but no access token was returned.');
    }
    
    await storage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setStagingBearerToken(token);
    
    const profile: UserProfile = user || {
      id: '',
      firstName: 'User',
      lastName: '',
      email: '',
      isEmailVerified: true,
      isPhoneVerified: false,
      role: 'landlord',
      authProvider: 'google',
    };
    
    await storage.setItem(USER_KEY, JSON.stringify(profile));
    
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'User';
    setUserName(fullName);
    if (profile.phoneNumber) {
      setUserPhone(profile.phoneNumber);
    }
    
    return profile;
  },

  /**
   * 9. Apple Signin API
   */
  async signInWithApple(identityToken: string, firstName?: string, lastName?: string): Promise<UserProfile> {
    const res = await api.post<SignInResponse>('/auth/apple', { identityToken, firstName, lastName });
    
    const token = 
      res.token || 
      res.accessToken || 
      res.data?.token || 
      res.data?.accessToken;

    const refreshToken = 
      res.refreshToken || 
      res.data?.refreshToken;
      
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Apple authentication succeeded, but no access token was returned.');
    }
    
    await storage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setStagingBearerToken(token);
    
    const profile: UserProfile = user || {
      id: '',
      firstName: firstName || 'Apple User',
      lastName: lastName || '',
      email: 'apple.user@example.com',
    };
    
    await storage.setItem(USER_KEY, JSON.stringify(profile));
    
    setUserName(`${profile.firstName} ${profile.lastName}`.trim() || profile.email);
    if (profile.phoneNumber) {
      setUserPhone(profile.phoneNumber);
    }
    
    return profile;
  },

  /**
   * Retrieve active session token
   */
  async getSessionToken(): Promise<string | null> {
    return await storage.getItem(TOKEN_KEY);
  },

  /**
   * Retrieve active refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await storage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Refresh session using refreshToken
   */
  async refreshSession(): Promise<string | null> {
    const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      if (__DEV__) {
        console.log('[AuthService] No refresh token found in storage.');
      }
      return null;
    }

    try {
      if (__DEV__) {
        console.log('[AuthService] Refreshing access token with refresh token...');
      }

      const res = await fetch('https://buildsure-server-770307294180.europe-west1.run.app/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (__DEV__) {
        console.log(`[AuthService] Refresh Token Response [${res.status}]:`, responseData);
      }

      const newAccessToken = responseData?.data?.accessToken || responseData?.accessToken;
      const newRefreshToken = responseData?.data?.refreshToken || responseData?.refreshToken || refreshToken;

      if (res.ok && newAccessToken) {
        await storage.setItem(TOKEN_KEY, newAccessToken);
        await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        setStagingBearerToken(newAccessToken);
        return newAccessToken;
      }

      return null;
    } catch (err) {
      if (__DEV__) {
        console.error('[AuthService] Refresh session failed:', err);
      }
      return null;
    }
  },

  /**
   * Check if user is authenticated and load profile
   */
  async checkSession(): Promise<UserProfile | null> {
    try {
      const token = await this.getSessionToken();
      if (!token) return null;
      setStagingBearerToken(token);
      
      const userStr = await storage.getItem(USER_KEY);
      if (!userStr) return null;
      
      const profile: UserProfile = JSON.parse(userStr);
      
      // Load into local memory store
      setUserName(`${profile.firstName} ${profile.lastName}`.trim() || profile.email);
      if (profile.phoneNumber) {
        setUserPhone(profile.phoneNumber);
      }
      
      return profile;
    } catch (e) {
      console.warn('[Session Recovery Failed]', e);
      return null;
    }
  },

  /**
   * Terminate active session
   */
  async signOut(): Promise<void> {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(REFRESH_TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    setStagingBearerToken('bearerToken');
    setUserName('');
    setUserPhone('');
  }
};
