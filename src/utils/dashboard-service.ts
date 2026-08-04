import { api } from './api-client';
import { authService } from './auth-service';

export interface DashboardUser {
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface PortfolioValue {
  total: number;
  currency: string;
  percentChange: number;
  chartData: ChartDataPoint[];
}

export interface OverviewStatCount {
  count: number;
  percentChange: number;
}

export interface OverviewStatTotal {
  total: number;
  currency: string;
}

export interface DashboardOverview {
  totalProperties: OverviewStatCount;
  activeTenancies: OverviewStatCount;
  heldDeposit: OverviewStatTotal;
  totalRentalIncome: OverviewStatTotal;
}

export interface DashboardBanner {
  type: 'upload_signed_contract' | string;
  tenancyId: string;
  message: string;
}

export interface DashboardData {
  user: DashboardUser;
  portfolioValue: PortfolioValue;
  overview: DashboardOverview;
  banners: DashboardBanner[];
}

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

/**
 * Clean initial dashboard data state without hardcoded mock data
 */
export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  user: {
    firstName: '',
    lastName: '',
    profilePicture: '',
  },
  portfolioValue: {
    total: 0,
    currency: 'NGN',
    percentChange: 0,
    chartData: [],
  },
  overview: {
    totalProperties: {
      count: 0,
      percentChange: 0,
    },
    activeTenancies: {
      count: 0,
      percentChange: 0,
    },
    heldDeposit: {
      total: 0,
      currency: 'NGN',
    },
    totalRentalIncome: {
      total: 0,
      currency: 'NGN',
    },
  },
  banners: [],
};

export const dashboardService = {
  /**
   * Fetches dashboard metrics, portfolio overview, user profile, and action banners.
   * GET /api/v1/dashboard
   */
  async getDashboard(customToken?: string | null): Promise<DashboardData> {
    try {
      const token = customToken || (await authService.getSessionToken());
      const response = await api.get<DashboardApiResponse>('/dashboard', token);
      
      if (response && response.data) {
        return response.data;
      }
      if (response && (response as any).portfolioValue) {
        return response as unknown as DashboardData;
      }
      return DEFAULT_DASHBOARD_DATA;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[DashboardService] Live API call failed, using cached/fallback dashboard data:', error.message);
      }
      // Return default dashboard fallback structure so UI never crashes
      return DEFAULT_DASHBOARD_DATA;
    }
  },
};
