import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiNotificationItem, NotificationPaginationData } from '@/types/notification';
import { notificationService } from '@/utils/notification-service';

export interface NotificationState {
  notifications: ApiNotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk<
  NotificationPaginationData,
  { page?: number; limit?: number; isRefresh?: boolean } | undefined
>('notifications/fetchNotifications', async (params, { rejectWithValue }) => {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const data = await notificationService.getNotifications(page, limit);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch notifications');
  }
});

export const fetchUnreadCount = createAsyncThunk<number>(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const count = await notificationService.getUnreadCount();
      return count;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch unread count');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<string, string>(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk<void>(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotificationById = createAsyncThunk<string, string>(
  'notifications/deleteById',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete notification');
    }
  }
);

export const clearAllNotifications = createAsyncThunk<void>(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.clearAllNotifications();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to clear notifications');
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        if (action.meta.arg?.isRefresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        const page = action.payload.page || 1;
        if (page === 1) {
          state.notifications = action.payload.data || [];
        } else {
          // Append unique items
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const newItems = (action.payload.data || []).filter((n) => !existingIds.has(n.id));
          state.notifications = [...state.notifications, ...newItems];
        }
        state.total = action.payload.total ?? state.notifications.length;
        state.page = page;
        state.totalPages = action.payload.totalPages ?? 1;
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      });

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    // markNotificationAsRead
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const id = action.payload;
      const item = state.notifications.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // markAllNotificationsAsRead
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    });

    // deleteNotificationById
    builder.addCase(deleteNotificationById.fulfilled, (state, action) => {
      const id = action.payload;
      const item = state.notifications.find((n) => n.id === id);
      if (item && !item.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n.id !== id);
      state.total = Math.max(0, state.total - 1);
    });

    // clearAllNotifications
    builder.addCase(clearAllNotifications.fulfilled, (state) => {
      state.notifications = [];
      state.total = 0;
      state.unreadCount = 0;
    });
  },
});

export const { setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
