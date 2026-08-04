import { configureStore } from '@reduxjs/toolkit';
import propertyReducer from './slices/property-slice';
import authReducer from './slices/auth-slice';
import dashboardReducer from './slices/dashboard-slice';

export const store = configureStore({
  reducer: {
    properties: propertyReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
