'use client';

import { Tabs, TabsList, TabsTrigger, FilterSelect } from '@busmate/ui';
import {
  AnalyticsOverview,
  TripAnalyticsPanel,
  RouteAnalyticsPanel,
  FleetAnalyticsPanel,
  StaffAnalyticsPanel,
  RevenueAnalyticsPanel,
  PassengerAnalyticsPanel,
} from '@/components/mot/analytics';
import { useAnalyticsPage } from '@/components/mot/analytics/useAnalyticsPage';
import type { AnalyticsCategory, DateRange } from '@/data/mot/analytics';

export default function AnalyticsPage() {
  const {
    activeCategory, setActiveCategory,
    dateRange, setDateRange,
    region, setRegion,
    operator, setOperator,
    loading,
    kpis, trendHistory,
    tripAnalytics, routeAnalytics, fleetAnalytics,
    staffAnalytics, revenueAnalytics, passengerAnalytics,
    dateRangeOptions, regionOptions, operatorOptions,
  } = useAnalyticsPage();

  return (
    <div className="space-y-6">
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
