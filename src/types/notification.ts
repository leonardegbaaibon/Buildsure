export type NotificationType =
  | 'rent_due'
  | 'maintenance'
  | 'lease_renewal'
  | 'system'
  | 'tenancy'
  | 'property'
  | 'value_update'
  | 'payment_lease'
  | string;

export interface ApiNotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationPaginationData {
  data: ApiNotificationItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface NotificationsApiResponse {
  success: boolean;
  message?: string;
  data: NotificationPaginationData;
}

export interface UnreadCountResponse {
  success: boolean;
  message?: string;
  data: {
    count: number;
  };
}
