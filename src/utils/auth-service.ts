import { api, setStagingBearerToken } from './api-client';
import { storage } from './storage';
import { setUserName, setUserPhone } from './user-store';

const TOKEN_KEY = 'buildsure_auth_token';
const USER_KEY = 'buildsure_auth_user';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password?: string;
}

export interface SignInResponse {
  token?: string;
  accessToken?: string;
  user?: UserProfile;
  data?: {
    token?: string;
    accessToken?: string;
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
    return await api.post('/auth/verify-phone', { userId, code });
  },

  /**
   * 3. Resend Phone Verification Code API
   */
  async resendPhoneCode(userId: string): Promise<any> {
    return await api.post('/auth/resend-phone-code', { userId });
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
      
    // Extract user profile
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Login succeeded, but no access token was returned.');
    }
    
    // Save credentials to local persistent storage
    await storage.setItem(TOKEN_KEY, token);
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
   */
  async signInWithGoogle(idToken: string): Promise<UserProfile> {
    const res = await api.post<SignInResponse>('/auth/google', { idToken });
    
    const token = 
      res.token || 
      res.accessToken || 
      res.data?.token || 
      res.data?.accessToken;
      
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Google authentication succeeded, but no access token was returned.');
    }
    
    await storage.setItem(TOKEN_KEY, token);
    
    const profile: UserProfile = user || {
      id: '',
      firstName: 'Google User',
      lastName: '',
      email: 'google.user@example.com',
    };
    
    await storage.setItem(USER_KEY, JSON.stringify(profile));
    
    setUserName(`${profile.firstName} ${profile.lastName}`.trim() || profile.email);
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
      
    const user = res.user || res.data?.user;
    
    if (!token) {
      throw new Error('Apple authentication succeeded, but no access token was returned.');
    }
    
    await storage.setItem(TOKEN_KEY, token);
    
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
    await storage.removeItem(USER_KEY);
    setUserName('');
    setUserPhone('');
  }
};
