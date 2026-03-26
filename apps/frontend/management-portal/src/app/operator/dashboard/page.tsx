'use client';

import { RefreshCw, Radio } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useOperatorDashboard } from '@/hooks/useOperatorDashboard';
import {
  OperatorDashboardKPICards,
  OperatorDashboardTrendsChart,
  OperatorDashboardFleetStatus,
  OperatorDashboardRoutePerformance,
  OperatorDashboardStaffStatus,
  OperatorDashboardAlertsWidget,
  OperatorDashboardActivityFeed,
  OperatorDashboardQuickActions,
} from '@/components/operator/dashboard';

export default function OperatorDashboardPage() {
  useSetPageMetadata({
    title: 'Fleet Dashboard',
    description: 'Real-time overview of your fleet operations, revenue, and performance metrics',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Dashboard' }],
  });

  const {
    kpis,
    trendHistory,
    activity,
    alerts,
    fleetStatus,
    routePerformance,
    staffStatus,
    quickActions,
    loading,
    lastRefresh,
    isLive,
    refresh,
    toggleLive,
    onAcknowledgeAlert,
  } = useOperatorDashboard({ refreshInterval: 5000 });

  const timeStr = lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveCls = isLive ? 'bg-success/15 text-success hover:bg-success/20' : 'bg-muted text-muted-foreground hover:bg-muted';

  useSetPageActions(
    <>
      <span className="text-xs text-muted-foreground hidden sm:inline">Updated {timeStr}</span>
      <button onClick={toggleLive} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${liveCls}`}>
        <Radio className={`h-3.5 w-3.5 ${isLive ? 'animate-pulse' : ''}`} />
        {isLive ? 'Live' : 'Paused'}
      </button>
      <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-background border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <OperatorDashboardKPICards kpis={kpis} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <OperatorDashboardTrendsChart trendHistory={trendHistory} loading={loading} />
        </div>
        <OperatorDashboardFleetStatus fleetStatus={fleetStatus} loading={loading} />
      </div>

      <OperatorDashboardRoutePerformance routes={routePerformance} loading={loading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OperatorDashboardStaffStatus staffStatus={staffStatus} loading={loading} />
        <OperatorDashboardAlertsWidget alerts={alerts} loading={loading} onAcknowledge={onAcknowledgeAlert} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <OperatorDashboardActivityFeed activity={activity} loading={loading} />
        </div>
        <OperatorDashboardQuickActions actions={quickActions} loading={loading} />
      </div>
    </div>
  );
}

