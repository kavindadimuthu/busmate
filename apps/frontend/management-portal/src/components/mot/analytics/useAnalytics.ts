'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAnalyticsKPIs,
  getAnalyticsTrends,
  getTripAnalytics,
  getRouteAnalytics,
  getFleetAnalytics,
  getStaffAnalytics,
  getRevenueAnalytics,
  getPassengerAnalytics,
  getAnalyticsFilterOptions,
  simulateAnalyticsTick,
  type AnalyticsKPIMetric,
  type TrendPoint,
  type TripAnalyticsData,
  type RouteAnalyticsData,
  type FleetAnalyticsData,
  type StaffAnalyticsData,
  type RevenueAnalyticsData,
  type PassengerAnalyticsData,
  type AnalyticsFilterOptions,
  type DateRange,
  type AnalyticsCategory,
} from '@/data/mot/analytics';

export function useAnalytics() {
  // State
  const [activeCategory, setActiveCategory] = useState<AnalyticsCategory>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [region, setRegion] = useState<string>('All Regions');
  const [operator, setOperator] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data states
  const [kpis, setKpis] = useState<AnalyticsKPIMetric[]>([]);
  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>([]);
  const [tripAnalytics, setTripAnalytics] = useState<TripAnalyticsData | null>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsData | null>(null);
  const [fleetAnalytics, setFleetAnalytics] = useState<FleetAnalyticsData | null>(null);
  const [staffAnalytics, setStaffAnalytics] = useState<StaffAnalyticsData | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalyticsData | null>(null);
  const [passengerAnalytics, setPassengerAnalytics] = useState<PassengerAnalyticsData | null>(null);
  const [filterOptions, setFilterOptions] = useState<AnalyticsFilterOptions | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setKpis(getAnalyticsKPIs());
      setTrendHistory(getAnalyticsTrends());
      setTripAnalytics(getTripAnalytics());
      setRouteAnalytics(getRouteAnalytics());
      setFleetAnalytics(getFleetAnalytics());
      setStaffAnalytics(getStaffAnalytics());
      setRevenueAnalytics(getRevenueAnalytics());
      setPassengerAnalytics(getPassengerAnalytics());
      setFilterOptions(getAnalyticsFilterOptions());
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      simulateAnalyticsTick();
      setKpis(getAnalyticsKPIs());
      setLastRefresh(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const handleExport = () => {
    alert('Generating analytics report...');
  };

  // Filter option lists
  const dateRangeOptions = (filterOptions?.dateRanges ?? []).map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const regionOptions = (filterOptions?.regions ?? []).map((r) => ({
    value: r,
    label: r,
  }));

  const operatorOptions = (filterOptions?.operators ?? []).map((op) => ({
    value: op.id,
    label: op.name,
  }));

  return {
    activeCategory,
    setActiveCategory,
    dateRange,
    setDateRange,
    region,
    setRegion,
    operator,
    setOperator,
    loading,
    isLive,
    setIsLive,
    lastRefresh,
    kpis,
    trendHistory,
    tripAnalytics,
    routeAnalytics,
    fleetAnalytics,
    staffAnalytics,
    revenueAnalytics,
    passengerAnalytics,
    loadData,
    handleExport,
    dateRangeOptions,
    regionOptions,
    operatorOptions,
  };
}
