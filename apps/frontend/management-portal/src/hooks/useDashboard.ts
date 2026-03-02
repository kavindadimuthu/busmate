'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DashboardSnapshot,
  KPIMetric,
  TrendPoint,
  ActivityEntry,
  ServiceSummary,
  UserDistribution,
  ActiveAlertEntry,
  getDashboardSnapshot,
  simulateDashboardTick,
} from '@/data/admin/dashboard-v2';

// ── Configuration ────────────────────────────────────────────────

const DEFAULT_REFRESH_INTERVAL = 5000; // 5 s

// ── Types ────────────────────────────────────────────────────────

export interface UseDashboardOptions {
  /** Polling interval in ms. Set 0 to disable auto-refresh. Default: 5000 */
  refreshInterval?: number;
}

export interface DashboardState {
  kpis: KPIMetric[];
  trendHistory: TrendPoint[];
  activity: ActivityEntry[];
  services: ServiceSummary[];
  userDistribution: UserDistribution[];
  activeAlerts: ActiveAlertEntry[];

  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;

  refresh: () => void;
  toggleLive: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useDashboard(options: UseDashboardOptions = {}): DashboardState {
  const { refreshInterval = DEFAULT_REFRESH_INTERVAL } = options;

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLive, setIsLive]     = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load / refresh ───────────────────────────────────────────

  const refresh = useCallback(() => {
    // ── TODO: when backend is ready, replace simulateDashboardTick()
    // ──       and getDashboardSnapshot() with a single fetch:
    // ──       const data = await fetch('/api/dashboard/snapshot').then(r => r.json());
    // ──       setSnapshot(data);
    simulateDashboardTick();
    setSnapshot(getDashboardSnapshot());
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // ── Initial load ──────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    refresh();
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

  return {
    kpis:             snapshot?.kpis             ?? [],
    trendHistory:     snapshot?.trendHistory      ?? [],
    activity:         snapshot?.activity          ?? [],
    services:         snapshot?.services          ?? [],
    userDistribution: snapshot?.userDistribution  ?? [],
    activeAlerts:     snapshot?.activeAlerts       ?? [],

    loading,
    lastRefresh,
    isLive,

    refresh,
    toggleLive,
  };
}
