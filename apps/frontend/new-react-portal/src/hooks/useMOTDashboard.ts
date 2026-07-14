'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DashboardSnapshot,
  KPIMetric,
  TrendPoint,
  ActivityEntry,
  AlertEntry,
  FleetStatusItem,
  RouteStatusItem,
  PermitStatusItem,
  OperatorPerformanceItem,
  RegionalDistributionItem,
  QuickAction,
  getDashboardSnapshot,
  simulateDashboardTick,
  acknowledgeAlert,
} from '@/data/mot/dashboard';

// ── Configuration ────────────────────────────────────────────────

const DEFAULT_REFRESH_INTERVAL = 5000; // 5 s

// ── Types ────────────────────────────────────────────────────────

export interface UseMOTDashboardOptions {
  /** Polling interval in ms. Set 0 to disable auto-refresh. Default: 5000 */
  refreshInterval?: number;
}

export interface MOTDashboardState {
  kpis: KPIMetric[];
  trendHistory: TrendPoint[];
  activity: ActivityEntry[];
  alerts: AlertEntry[];
  fleetStatus: FleetStatusItem[];
  routeStatus: RouteStatusItem[];
  permitStatus: PermitStatusItem[];
  operatorPerformance: OperatorPerformanceItem[];
  regionalDistribution: RegionalDistributionItem[];
  quickActions: QuickAction[];

  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;

  refresh: () => void;
  toggleLive: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useMOTDashboard(options: UseMOTDashboardOptions = {}): MOTDashboardState {
  const { refreshInterval = DEFAULT_REFRESH_INTERVAL } = options;

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load / refresh ───────────────────────────────────────────

  const refresh = useCallback(() => {
    // ── TODO: when backend is ready, replace simulateDashboardTick()
    // ──       and getDashboardSnapshot() with a single fetch:
    // ──       const data = await fetch('/api/mot/dashboard/snapshot').then(r => r.json());
    // ──       setSnapshot(data);
    simulateDashboardTick();
    setSnapshot(getDashboardSnapshot());
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // ── Initial load ──────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    // Simulate initial API delay
    const timeout = setTimeout(() => {
      refresh();
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Live polling ──────────────────────────────────────────────

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isLive && refreshInterval > 0) {
      timerRef.current = setInterval(refresh, refreshInterval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive, refresh, refreshInterval]);

  const toggleLive = useCallback(() => setIsLive((v) => !v), []);

  const onAcknowledgeAlert = useCallback((alertId: string) => {
    acknowledgeAlert(alertId);
    setSnapshot(getDashboardSnapshot());
  }, []);

  return {
    kpis:                 snapshot?.kpis                 ?? [],
    trendHistory:         snapshot?.trendHistory         ?? [],
    activity:             snapshot?.activity             ?? [],
    alerts:               snapshot?.alerts               ?? [],
    fleetStatus:          snapshot?.fleetStatus          ?? [],
    routeStatus:          snapshot?.routeStatus          ?? [],
    permitStatus:         snapshot?.permitStatus         ?? [],
    operatorPerformance:  snapshot?.operatorPerformance  ?? [],
    regionalDistribution: snapshot?.regionalDistribution ?? [],
    quickActions:         snapshot?.quickActions         ?? [],

    loading,
    lastRefresh,
    isLive,

    refresh,
    toggleLive,
    onAcknowledgeAlert,
  };
}
