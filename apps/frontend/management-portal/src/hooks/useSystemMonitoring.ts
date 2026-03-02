'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PerformanceSnapshot,
  ResourceSnapshot,
  ApiEndpointMetric,
  MicroserviceInfo,
  MonitoringAlert,
  AlertRule,
  SystemHealthSummary,
  getPerformanceHistory,
  getLatestPerformance,
  getResourceHistory,
  getLatestResource,
  getApiEndpointMetrics,
  getMicroserviceList,
  getMonitoringAlerts,
  getActiveAlerts,
  getAlertRules,
  getSystemHealthSummary,
  simulatePerformanceTick,
  simulateResourceTick,
  simulateApiEndpointTick,
  acknowledgeAlert,
  resolveAlert,
  toggleAlertRule,
  restartMicroservice,
} from '@/data/admin/system-monitoring';

// ── Configuration ────────────────────────────────────────────────

const DEFAULT_REFRESH_INTERVAL = 5000; // 5 seconds

// ── useSystemMonitoring ──────────────────────────────────────────
// Central hook that provides all system monitoring data with
// simulated real-time updates. When the backend is ready, replace
// the data source imports above with actual API fetch calls.

export interface UseSystemMonitoringOptions {
  /** Refresh interval in ms (default 5000). Set 0 to disable auto-refresh. */
  refreshInterval?: number;
  /** Which data slices to enable. Defaults to all true. */
  enablePerformance?: boolean;
  enableResources?: boolean;
  enableApiMonitoring?: boolean;
  enableAlerts?: boolean;
}

export interface SystemMonitoringState {
  // Data
  healthSummary: SystemHealthSummary | null;
  performanceHistory: PerformanceSnapshot[];
  latestPerformance: PerformanceSnapshot | null;
  resourceHistory: ResourceSnapshot[];
  latestResource: ResourceSnapshot | null;
  apiEndpoints: ApiEndpointMetric[];
  microservices: MicroserviceInfo[];
  alerts: MonitoringAlert[];
  activeAlerts: MonitoringAlert[];
  alertRules: AlertRule[];

  // State
  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;

  // Actions
  refresh: () => void;
  toggleLive: () => void;
  handleAcknowledgeAlert: (alertId: string) => Promise<void>;
  handleResolveAlert: (alertId: string) => Promise<void>;
  handleToggleAlertRule: (ruleId: string) => Promise<void>;
  handleRestartService: (serviceId: string) => Promise<void>;
}

export function useSystemMonitoring(
  options: UseSystemMonitoringOptions = {}
): SystemMonitoringState {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    enablePerformance = true,
    enableResources = true,
    enableApiMonitoring = true,
    enableAlerts = true,
  } = options;

  // ── State ────────────────────────────────────────────────────

  const [healthSummary, setHealthSummary] = useState<SystemHealthSummary | null>(null);
  const [perfHistory, setPerfHistory] = useState<PerformanceSnapshot[]>([]);
  const [latestPerf, setLatestPerf] = useState<PerformanceSnapshot | null>(null);
  const [resHistory, setResHistory] = useState<ResourceSnapshot[]>([]);
  const [latestRes, setLatestRes] = useState<ResourceSnapshot | null>(null);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointMetric[]>([]);
  const [microservices, setMicroservices] = useState<MicroserviceInfo[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [activeAlertsState, setActiveAlerts] = useState<MonitoringAlert[]>([]);
  const [alertRulesState, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial load ─────────────────────────────────────────────

  const loadAllData = useCallback(() => {
    setLoading(true);

    // TODO: Replace each getter with an async API call and use Promise.allSettled
    setHealthSummary(getSystemHealthSummary());

    if (enablePerformance) {
      setPerfHistory(getPerformanceHistory(4));
      setLatestPerf(getLatestPerformance());
    }
    if (enableResources) {
      setResHistory(getResourceHistory(4));
      setLatestRes(getLatestResource());
    }
    if (enableApiMonitoring) {
      setApiEndpoints(getApiEndpointMetrics());
      setMicroservices(getMicroserviceList());
    }
    if (enableAlerts) {
      setAlerts(getMonitoringAlerts());
      setActiveAlerts(getActiveAlerts());
      setAlertRules(getAlertRules());
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, [enablePerformance, enableResources, enableApiMonitoring, enableAlerts]);

  // ── Real-time tick ───────────────────────────────────────────

  const tick = useCallback(() => {
    // Simulate new data points
    if (enablePerformance) {
      const newPerf = simulatePerformanceTick();
      setPerfHistory((prev) => {
        const updated = [...prev, newPerf];
        return updated.length > 4 * 12 ? updated.slice(-4 * 12) : updated;
      });
      setLatestPerf(newPerf);
    }
    if (enableResources) {
      const newRes = simulateResourceTick();
      setResHistory((prev) => {
        const updated = [...prev, newRes];
        return updated.length > 4 * 12 ? updated.slice(-4 * 12) : updated;
      });
      setLatestRes(newRes);
    }
    if (enableApiMonitoring) {
      setApiEndpoints(simulateApiEndpointTick());
    }

    // Refresh derived data
    setHealthSummary(getSystemHealthSummary());
    if (enableAlerts) {
      setAlerts(getMonitoringAlerts());
      setActiveAlerts(getActiveAlerts());
    }
    setLastRefresh(new Date());
  }, [enablePerformance, enableResources, enableApiMonitoring, enableAlerts]);

  // ── Timer management ─────────────────────────────────────────

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (isLive && refreshInterval > 0) {
      timerRef.current = setInterval(tick, refreshInterval);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLive, refreshInterval, tick]);

  // ── Actions ──────────────────────────────────────────────────

  const refresh = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    await acknowledgeAlert(alertId);
    setAlerts(getMonitoringAlerts());
    setActiveAlerts(getActiveAlerts());
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    await resolveAlert(alertId);
    setAlerts(getMonitoringAlerts());
    setActiveAlerts(getActiveAlerts());
  }, []);

  const handleToggleAlertRule = useCallback(async (ruleId: string) => {
    await toggleAlertRule(ruleId);
    setAlertRules(getAlertRules());
  }, []);

  const handleRestartService = useCallback(async (serviceId: string) => {
    await restartMicroservice(serviceId);
    setMicroservices(getMicroserviceList());
  }, []);

  return {
    healthSummary,
    performanceHistory: perfHistory,
    latestPerformance: latestPerf,
    resourceHistory: resHistory,
    latestResource: latestRes,
    apiEndpoints,
    microservices,
    alerts,
    activeAlerts: activeAlertsState,
    alertRules: alertRulesState,
    loading,
    lastRefresh,
    isLive,
    refresh,
    toggleLive,
    handleAcknowledgeAlert,
    handleResolveAlert,
    handleToggleAlertRule,
    handleRestartService,
  };
}
