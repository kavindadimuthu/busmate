'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, FilterSelect } from '@busmate/ui';

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

export default function AnalyticsPage() {
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

  // Page actions
  useSetPageActions(
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 hidden sm:inline">
        Updated {lastRefresh.toLocaleTimeString()}
      </span>

      <Button
        variant={isLive ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsLive((prev) => !prev)}
        className={isLive ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}
      >
        {isLive ? '● Live' : '○ Live'}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={loadData}
        disabled={loading}
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <Button onClick={handleExport}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export Report</span>
      </Button>
    </div>
  );

  // Date range options for FilterSelect
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

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AnalyticsCategory)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="passengers">Passengers</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {dateRangeOptions.length > 0 && (
              <FilterSelect
                label="Period"
                value={dateRange}
                onChange={(v: string) => setDateRange(v as DateRange)}
                options={dateRangeOptions}
                placeholder="Date Range"
              />
            )}
            {regionOptions.length > 0 && (
              <div className="hidden md:block">
                <FilterSelect
                  label="Region"
                  value={region}
                  onChange={setRegion}
                  options={regionOptions}
                  placeholder="All Regions"
                />
              </div>
            )}
            {operatorOptions.length > 0 && (
              <div className="hidden lg:block">
                <FilterSelect
                  label="Operator"
                  value={operator}
                  onChange={setOperator}
                  options={operatorOptions}
                  placeholder="All Operators"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeCategory === 'overview' && (
        <AnalyticsOverview
          kpis={kpis}
          trendHistory={trendHistory}
          tripStatusDistribution={tripAnalytics?.statusDistribution || []}
          routeTypeDistribution={routeAnalytics?.routeTypeDistribution || []}
          loading={loading}
        />
      )}
      {activeCategory === 'trips' && tripAnalytics && (
        <TripAnalyticsPanel data={tripAnalytics} loading={loading} />
      )}
      {activeCategory === 'routes' && routeAnalytics && (
        <RouteAnalyticsPanel data={routeAnalytics} loading={loading} />
      )}
      {activeCategory === 'fleet' && fleetAnalytics && (
        <FleetAnalyticsPanel data={fleetAnalytics} loading={loading} />
      )}
      {activeCategory === 'staff' && staffAnalytics && (
        <StaffAnalyticsPanel data={staffAnalytics} loading={loading} />
      )}
      {activeCategory === 'revenue' && revenueAnalytics && (
        <RevenueAnalyticsPanel data={revenueAnalytics} loading={loading} />
      )}
      {activeCategory === 'passengers' && passengerAnalytics && (
        <PassengerAnalyticsPanel data={passengerAnalytics} loading={loading} />
      )}
    </div>
  );
}
