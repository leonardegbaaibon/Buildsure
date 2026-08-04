import { api } from './api-client';
import { authService } from './auth-service';
import { FullUserProfile, ProfileApiResponse } from '@/types/profile';

export const profileService = {
  /**
   * Fetches user profile directly from GET /api/v1/profile
   */
  async getProfile(customToken?: string | null): Promise<FullUserProfile> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<ProfileApiResponse | any>('/profile', token);
      
      if (response && response.data) {
        return response.data;
      }
      return response as FullUserProfile;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[ProfileService] Failed to fetch profile from GET /profile:', error.message);
      }
      throw error;
    }
  },
};
