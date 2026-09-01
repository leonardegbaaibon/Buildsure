import { api } from './api-client';
import { authService } from './auth-service';
import {
  ApiNotificationItem,
  NotificationsApiResponse,
  UnreadCountResponse,
  NotificationPaginationData,
} from '@/types/notification';

export const notificationService = {
  /**
   * Fetch paginated notifications
   * GET /api/v1/notifications?page=1&limit=20
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    customToken?: string | null
  ): Promise<NotificationPaginationData> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<NotificationsApiResponse>(
        `/notifications?page=${page}&limit=${limit}`,
        token
      );
      if (response?.data) {
        return response.data;
      }
      return {
        data: [],
        total: 0,
        page,
        totalPages: 1,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[NotificationService] getNotifications error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Get unread notifications count
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(customToken?: string | null): Promise<number> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<UnreadCountResponse>(
        '/notifications/unread-count',
        token
      );
      if (response?.data?.count !== undefined) {
        return response.data.count;
      }
      return 0;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[NotificationService] getUnreadCount error:', error.message);
      }
      return 0;
    }
  },

  /**
   * Mark a single notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(id: string, customToken?: string | null): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.patch<{ success: boolean; message: string }>(
        `/notifications/${id}/read`,
        {},
        token
      );
      return response?.success ?? true;
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`[NotificationService] markAsRead (${id}) error:`, error.message);
      }
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(customToken?: string | null): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.patch<{ success: boolean; message: string }>(
        '/notifications/read-all',
        {},
        token
      );
      return response?.success ?? true;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[NotificationService] markAllAsRead error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Delete a single notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(id: string, customToken?: string | null): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.delete<{ success: boolean; message: string }>(
        `/notifications/${id}`,
        token
      );
      return response?.success ?? true;
    } catch (error: any) {
      if (__DEV__) {
        console.warn(`[NotificationService] deleteNotification (${id}) error:`, error.message);
      }
      throw error;
    }
  },

  /**
   * Clear all landlord notifications
   * DELETE /api/v1/notifications
   */
  async clearAllNotifications(customToken?: string | null): Promise<boolean> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.delete<{ success: boolean; message: string }>(
        '/notifications',
        token
      );
      return response?.success ?? true;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[NotificationService] clearAllNotifications error:', error.message);
      }
      throw error;
    }
  },
};
