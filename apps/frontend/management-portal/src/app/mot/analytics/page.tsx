'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, RefreshCw, Calendar, Filter } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { SwitchableTabs, type TabItem } from '@/components/shared/SwitchableTabs';

// Analytics components
import {
  AnalyticsOverview,
  TripAnalyticsPanel,
  RouteAnalyticsPanel,
  FleetAnalyticsPanel,
  StaffAnalyticsPanel,
  RevenueAnalyticsPanel,
  PassengerAnalyticsPanel,
} from '@/components/mot/analytics';

// Data
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

// ── Tab configuration ────────────────────────────────────────────

const CATEGORY_TABS: TabItem<AnalyticsCategory>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trips', label: 'Trips' },
  { id: 'routes', label: 'Routes' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'staff', label: 'Staff' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'passengers', label: 'Passengers' },
];

// ── Main Page Component ──────────────────────────────────────────

export default function AnalyticsPage() {
  // Page metadata
  useSetPageMetadata({
    title: 'Analytics Dashboard',
    description: 'Comprehensive data insights and performance analytics for MOT operations',
    activeItem: 'analytics',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Analytics' }],
  });

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
      // Simulate API delay
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

  // Initial load
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

  // Actions
  const handleRefresh = () => {
    loadData();
  };

  const handleExport = () => {
    // In a real app, this would generate and download a PDF/Excel report
    alert('Generating analytics report...');
  };

  const toggleLive = () => {
    setIsLive((prev) => !prev);
  };

  // Page actions
  useSetPageActions(
    <div className="flex items-center gap-2">
      {/* Last updated */}
      <span className="text-xs text-gray-400 hidden sm:inline">
        Updated {lastRefresh.toLocaleTimeString()}
      </span>

      {/* Live toggle */}
      <button
        onClick={toggleLive}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isLive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isLive ? '● Live' : '○ Live'}
      </button>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export Report</span>
      </button>
    </div>
  );

  // Render content based on active category
  const renderContent = () => {
    switch (activeCategory) {
      case 'overview':
        return (
          <AnalyticsOverview
            kpis={kpis}
            trendHistory={trendHistory}
            tripStatusDistribution={tripAnalytics?.statusDistribution || []}
            routeTypeDistribution={routeAnalytics?.routeTypeDistribution || []}
            loading={loading}
          />
        );
      case 'trips':
        return tripAnalytics ? (
          <TripAnalyticsPanel data={tripAnalytics} loading={loading} />
        ) : null;
      case 'routes':
        return routeAnalytics ? (
          <RouteAnalyticsPanel data={routeAnalytics} loading={loading} />
        ) : null;
      case 'fleet':
        return fleetAnalytics ? (
          <FleetAnalyticsPanel data={fleetAnalytics} loading={loading} />
        ) : null;
      case 'staff':
        return staffAnalytics ? (
          <StaffAnalyticsPanel data={staffAnalytics} loading={loading} />
        ) : null;
      case 'revenue':
        return revenueAnalytics ? (
          <RevenueAnalyticsPanel data={revenueAnalytics} loading={loading} />
        ) : null;
      case 'passengers':
        return passengerAnalytics ? (
          <PassengerAnalyticsPanel data={passengerAnalytics} loading={loading} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <SwitchableTabs
            tabs={CATEGORY_TABS}
            activeTab={activeCategory}
            onTabChange={setActiveCategory}
            ariaLabel="Analytics category"
          />

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="text-sm border-0 bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer pr-6"
              >
                {filterOptions?.dateRanges.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div className="hidden md:flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="text-sm border-0 bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer pr-6"
              >
                {filterOptions?.regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator Filter */}
            <div className="hidden lg:flex items-center gap-2">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="text-sm border-0 bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer pr-6"
              >
                {filterOptions?.operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
