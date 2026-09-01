import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './slices/property-slice';
import authReducer from './slices/auth-slice';
import dashboardReducer from './slices/dashboard-slice';
import tenancyReducer from './slices/tenancy-slice';
import documentReducer from './slices/document-slice';
import notificationReducer from './slices/notification-slice';

export const store = configureStore({
  reducer: {
    properties: propertyReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
    tenancy: tenancyReducer,
    documents: documentReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
