'use client';

import { RefreshCw, Radio } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useMOTDashboard } from '@/hooks/useMOTDashboard';
import {
  MOTDashboardKPICards,
  MOTDashboardTrendsChart,
  MOTDashboardActivityFeed,
  MOTDashboardAlertsWidget,
  MOTDashboardFleetStatus,
  MOTDashboardRouteStatus,
  MOTDashboardPermitStatus,
  MOTDashboardOperatorPerformance,
  MOTDashboardQuickActions,
  MOTDashboardRegionalDistribution,
} from '@/components/mot/dashboard';

export default function MOTDashboardPage() {
  useSetPageMetadata({
    title: 'Operations Dashboard',
    description: 'Real-time overview of transport operations, fleet status, and key metrics',
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
    routeStatus,
    permitStatus,
    operatorPerformance,
    regionalDistribution,
    quickActions,
    loading,
    lastRefresh,
    isLive,
    refresh,
    toggleLive,
    onAcknowledgeAlert,
  } = useMOTDashboard({ refreshInterval: 5000 });

  useSetPageActions(
    <>
      <span className="text-xs text-gray-400 hidden sm:inline">
        Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <button
        onClick={toggleLive}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isLive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Radio className={`h-3.5 w-3.5 ${isLive ? 'animate-pulse' : ''}`} />
        {isLive ? 'Live' : 'Paused'}
      </button>
      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </>
  );

  return (
    <div className="space-y-6">

      {/* ── Row 1: KPI Cards ─────────────────────────────────────── */}
      <MOTDashboardKPICards kpis={kpis} loading={loading} />

      {/* ── Row 2: Trends chart + Fleet status ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MOTDashboardTrendsChart trendHistory={trendHistory} loading={loading} />
        </div>
        <div className="xl:col-span-1">
          <MOTDashboardFleetStatus fleetStatus={fleetStatus} loading={loading} />
        </div>
      </div>

      {/* ── Row 3: Route status + Permit status + Alerts ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <MOTDashboardRouteStatus routeStatus={routeStatus} loading={loading} />
        <MOTDashboardPermitStatus permitStatus={permitStatus} loading={loading} />
        <MOTDashboardAlertsWidget 
          alerts={alerts} 
          loading={loading} 
          onAcknowledge={onAcknowledgeAlert} 
        />
      </div>

      {/* ── Row 4: Regional distribution + Operator performance ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MOTDashboardRegionalDistribution regions={regionalDistribution} loading={loading} />
        <MOTDashboardOperatorPerformance operators={operatorPerformance} loading={loading} />
      </div>

      {/* ── Row 5: Activity feed + Quick actions ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MOTDashboardActivityFeed activity={activity} loading={loading} />
        </div>
        <div className="xl:col-span-1">
          <MOTDashboardQuickActions actions={quickActions} loading={loading} />
        </div>
      </div>
    </div>
  );
}
