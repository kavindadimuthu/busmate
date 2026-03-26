'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, Button, FilterSelect } from '@busmate/ui';

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

import { useAnalytics } from '@/components/mot/analytics/useAnalytics';
import type { AnalyticsCategory, DateRange } from '@/data/mot/analytics';

export default function AnalyticsPage() {
  useSetPageMetadata({
    title: 'Analytics Dashboard',
    description: 'Comprehensive data insights and performance analytics for MOT operations',
    activeItem: 'analytics',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Analytics' }],
  });

  const {
    activeCategory, setActiveCategory,
    dateRange, setDateRange,
    region, setRegion,
    operator, setOperator,
    loading, isLive, setIsLive, lastRefresh,
    kpis, trendHistory,
    tripAnalytics, routeAnalytics, fleetAnalytics,
    staffAnalytics, revenueAnalytics, passengerAnalytics,
    loadData, handleExport,
    dateRangeOptions, regionOptions, operatorOptions,
  } = useAnalytics();

  // Page actions
  useSetPageActions(
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground/70 hidden sm:inline">
        Updated {lastRefresh.toLocaleTimeString()}
      </span>
      <Button
        variant={isLive ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsLive((prev: boolean) => !prev)}
        className={isLive ? 'bg-success/15 text-success hover:bg-success/20 border-success/20' : ''}
      >
        {isLive ? '● Live' : '○ Live'}
      </Button>
      <Button variant="outline" size="icon" onClick={loadData} disabled={loading} title="Refresh data">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      <Button onClick={handleExport}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export Report</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex items-center gap-3">
            {dateRangeOptions.length > 0 && (
              <FilterSelect label="Period" value={dateRange} onChange={(v: string) => setDateRange(v as DateRange)} options={dateRangeOptions} placeholder="Date Range" />
            )}
            {regionOptions.length > 0 && (
              <div className="hidden md:block">
                <FilterSelect label="Region" value={region} onChange={setRegion} options={regionOptions} placeholder="All Regions" />
              </div>
            )}
            {operatorOptions.length > 0 && (
              <div className="hidden lg:block">
                <FilterSelect label="Operator" value={operator} onChange={setOperator} options={operatorOptions} placeholder="All Operators" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeCategory === 'overview' && (
        <AnalyticsOverview kpis={kpis} trendHistory={trendHistory} tripStatusDistribution={tripAnalytics?.statusDistribution || []} routeTypeDistribution={routeAnalytics?.routeTypeDistribution || []} loading={loading} />
      )}
      {activeCategory === 'trips' && tripAnalytics && <TripAnalyticsPanel data={tripAnalytics} loading={loading} />}
      {activeCategory === 'routes' && routeAnalytics && <RouteAnalyticsPanel data={routeAnalytics} loading={loading} />}
      {activeCategory === 'fleet' && fleetAnalytics && <FleetAnalyticsPanel data={fleetAnalytics} loading={loading} />}
      {activeCategory === 'staff' && staffAnalytics && <StaffAnalyticsPanel data={staffAnalytics} loading={loading} />}
      {activeCategory === 'revenue' && revenueAnalytics && <RevenueAnalyticsPanel data={revenueAnalytics} loading={loading} />}
      {activeCategory === 'passengers' && passengerAnalytics && <PassengerAnalyticsPanel data={passengerAnalytics} loading={loading} />}
    </div>
  );
}
