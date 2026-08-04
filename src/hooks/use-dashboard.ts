import { useState, useEffect, useCallback } from 'react';
import {
  dashboardService,
  DashboardData,
  DEFAULT_DASHBOARD_DATA,
} from '@/utils/dashboard-service';

export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const symbol = currency === 'NGN' ? '₦' : '$';
  if (isNaN(amount)) return `${symbol}0`;
  return `${symbol}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentChange(percent: number): string {
  if (isNaN(percent) || percent === 0) return '0%';
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(1)}%`;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(DEFAULT_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await dashboardService.getDashboard();
      setData(result);
    } catch (err: any) {
      console.error('[useDashboard Error]', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refetch = useCallback(() => {
    return fetchDashboard(true);
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
    formatCurrency,
    formatPercentChange,
  };
}
