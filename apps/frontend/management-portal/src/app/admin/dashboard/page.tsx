'use client';

import { RefreshCw, Radio } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useDashboard } from '@/hooks/useDashboard';
import {
  DashboardKPICards,
  DashboardTrendsChart,
  DashboardSystemHealth,
  DashboardAlertsWidget,
  DashboardUserStats,
  DashboardActivityFeed,
  DashboardQuickActions,
  DashboardServiceStatus,
} from '@/components/admin/dashboard';

export default function AdminDashboardPage() {
  useSetPageMetadata({
    title: 'System Dashboard',
    description: 'Real-time overview of system performance, user activity, and key metrics',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Dashboard' }],
  });

  const {
    kpis,
    trendHistory,
    activity,
    services,
    userDistribution,
    activeAlerts,
    loading,
    lastRefresh,
    isLive,
    refresh,
    toggleLive,
  } = useDashboard({ refreshInterval: 5000 });

  useSetPageActions(
    <>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <button
        onClick={toggleLive}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isLive
            ? 'bg-success/15 text-success hover:bg-success/20'
            : 'bg-muted text-muted-foreground hover:bg-muted'
        }`}
      >
        <Radio className={`h-3.5 w-3.5 ${isLive ? 'animate-pulse' : ''}`} />
        {isLive ? 'Live' : 'Paused'}
      </button>
      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-background border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <DashboardKPICards kpis={kpis} loading={loading} />

      {/* Row 2: Trends + Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[400px]">
        <div className="xl:col-span-2">
          <DashboardTrendsChart trendHistory={trendHistory} loading={loading} />
        </div>
        <div className="xl:col-span-1">
          <DashboardSystemHealth services={services} loading={loading} />
        </div>
      </div>

      {/* Row 3: Service + Users + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <DashboardServiceStatus services={services} loading={loading} />
        <DashboardUserStats userDistribution={userDistribution} loading={loading} />
        <DashboardAlertsWidget alerts={activeAlerts} loading={loading} />
      </div>

      {/* Row 4: Activity + Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DashboardActivityFeed activity={activity} loading={loading} />
        </div>
        <div className="xl:col-span-1">
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}
