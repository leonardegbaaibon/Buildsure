import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardData, DEFAULT_DASHBOARD_DATA, dashboardService } from '@/utils/dashboard-service';

export interface DashboardState {
  data: DashboardData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: DashboardState = {
  data: DEFAULT_DASHBOARD_DATA,
  status: 'idle',
  error: null,
};

export const fetchDashboardData = createAsyncThunk<DashboardData>(
  'dashboard/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardService.getDashboard();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch dashboard metrics');
    }
  }
);

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardData: (state, action: PayloadAction<DashboardData>) => {
      state.data = action.payload;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setDashboardData, clearDashboardError } = dashboardSlice.actions;

export default dashboardSlice.reducer;
