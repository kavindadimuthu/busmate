// Dashboard V2 – comprehensive mock data for admin portal overview
// ─────────────────────────────────────────────────────────────────
// When the backend is ready, replace each function marked with TODO
// with the corresponding API fetch call. The data shapes are
// intentionally kept stable so components need no changes.
//
// Backend endpoints (planned):
//   GET /api/dashboard/kpis          — KPI cards data
//   GET /api/dashboard/trends        — Historical trend data
//   GET /api/dashboard/activity      — Recent activity feed
//   GET /api/dashboard/services      — Service status summary
//   GET /api/dashboard/users/stats   — User distribution
//   GET /api/dashboard/alerts/active — Active alerts summary

// ── Types ────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: Trend;
  trendValue: string;
  /** true = up is good (e.g. users), false = up is bad (e.g. errors) */
  trendPositiveIsGood: boolean;
  sparkData: number[]; // last 20 data points
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal';
}

export interface TrendPoint {
  label: string; // e.g. "14:00"
  passengers: number;
  requestRate: number;
  errorRate: number;
  activeSessions: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'user' | 'system' | 'security' | 'transaction';
  action: string;
  target: string;
  severity: 'normal' | 'warning' | 'critical';
}

export interface ServiceSummary {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: string;
  responseTime: number; // ms
  errorRate: number;    // %
}

export interface UserDistribution {
  type: string;
  count: number;
  color: string;
}

export interface ActiveAlertEntry {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: string;
  createdAt: string;
}

export interface DashboardSnapshot {
  kpis: KPIMetric[];
  trendHistory: TrendPoint[];
  activity: ActivityEntry[];
  services: ServiceSummary[];
  userDistribution: UserDistribution[];
  activeAlerts: ActiveAlertEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drift(current: number, amount: number, min: number, max: number): number {
  const change = (Math.random() - 0.5) * 2 * amount;
  return Math.max(min, Math.min(max, Math.round((current + change) * 10) / 10));
}

function sparkSeries(seed: number, count = 20, spread = 10): number[] {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < count; i++) {
    v = drift(v, spread, seed * 0.5, seed * 1.8);
    arr.push(v);
  }
  return arr;
}

// ── Mock data generators ─────────────────────────────────────────

function makeKPIs(): KPIMetric[] {
  return [
    {
      id: 'kpi-users',
      label: 'Total Users',
      value: '1,924,381',
      rawValue: 1924381,
      unit: '',
      trend: 'up',
      trendValue: '+2,341 this week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(1920000, 20, 3000),
      color: 'blue',
    },
    {
      id: 'kpi-sessions',
      label: 'Active Sessions',
      value: '1,248',
      rawValue: 1248,
      unit: '',
      trend: 'up',
      trendValue: '+8.4% vs yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(1100, 20, 120),
      color: 'teal',
    },
    {
      id: 'kpi-uptime',
      label: 'System Uptime',
      value: '99.8%',
      rawValue: 99.8,
      unit: '%',
      trend: 'stable',
      trendValue: '72d 14h continuous',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(99.5, 20, 0.4),
      color: 'green',
    },
    {
      id: 'kpi-errors',
      label: 'Error Rate',
      value: '1.2%',
      rawValue: 1.2,
      unit: '%',
      trend: 'down',
      trendValue: '-0.3pp vs 1h ago',
      trendPositiveIsGood: false,
      sparkData: sparkSeries(1.5, 20, 0.5),
      color: 'red',
    },
    {
      id: 'kpi-transactions',
      label: 'Today\'s Transactions',
      value: 'Rs 1.47M',
      rawValue: 1470000,
      unit: '',
      trend: 'up',
      trendValue: '+14.2% vs yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(1400000, 20, 80000),
      color: 'purple',
    },
  ];
}

function makeTrendHistory(): TrendPoint[] {
  const now = Date.now();
  const points: TrendPoint[] = [];
  let pass = 145000, rr = 340, er = 1.2, sess = 1100;

  for (let i = 23; i >= 0; i--) {
    const dt = new Date(now - i * 3600 * 1000);
    const hour = dt.getHours();
    const label = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulate traffic patterns (peak at 8am and 5pm)
    const peakFactor = hour >= 7 && hour <= 9 ? 1.4 : hour >= 16 && hour <= 18 ? 1.3 : 1.0;

    pass = Math.round(drift(pass, 5000 * peakFactor, 80000, 200000));
    rr   = Math.round(drift(rr, 40 * peakFactor, 120, 900));
    er   = parseFloat(drift(er, 0.4, 0.1, 8.0).toFixed(1));
    sess = Math.round(drift(sess, 100 * peakFactor, 400, 3000));

    points.push({ label, passengers: pass, requestRate: rr, errorRate: er, activeSessions: sess });
  }
  return points;
}

const mockActivity: ActivityEntry[] = [
  {
    id: 'act-001',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    actor: 'John Perera',
    actorType: 'user',
    action: 'logged in via mobile app',
    target: 'Mobile App — Android',
    severity: 'normal',
  },
  {
    id: 'act-002',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    actor: 'System',
    actorType: 'system',
    action: 'database backup completed',
    target: 'PostgreSQL Primary — 4.2 GB',
    severity: 'normal',
  },
  {
    id: 'act-003',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    actor: 'Security Bot',
    actorType: 'security',
    action: 'blocked brute-force attempt',
    target: 'IP 196.44.11.22 — 47 requests',
    severity: 'warning',
  },
  {
    id: 'act-004',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    actor: 'Permit Service',
    actorType: 'system',
    action: 'service went offline',
    target: 'SVC-008 — All instances unreachable',
    severity: 'critical',
  },
  {
    id: 'act-005',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    actor: 'Payment Gateway',
    actorType: 'transaction',
    action: 'processed batch transactions',
    target: '1,247 transactions — Rs 284,500',
    severity: 'normal',
  },
  {
    id: 'act-006',
    timestamp: new Date(Date.now() - 52 * 60000).toISOString(),
    actor: 'Admin Nimali',
    actorType: 'user',
    action: 'created MOT officer account',
    target: 'Ruwan Senanayake — MOT Colombo',
    severity: 'normal',
  },
  {
    id: 'act-007',
    timestamp: new Date(Date.now() - 68 * 60000).toISOString(),
    actor: 'Route Service',
    actorType: 'system',
    action: 'updated schedule data',
    target: 'Route BC-138 — 22 stops modified',
    severity: 'normal',
  },
  {
    id: 'act-008',
    timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
    actor: 'Operator: Malwatte Bus Co.',
    actorType: 'user',
    action: 'registered new buses',
    target: '3 buses — NB4821, NB4822, NB4823',
    severity: 'normal',
  },
  {
    id: 'act-009',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    actor: 'System',
    actorType: 'security',
    action: 'security scan completed',
    target: 'No vulnerabilities found — 1,204 endpoints scanned',
    severity: 'normal',
  },
  {
    id: 'act-010',
    timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
    actor: 'Location Tracking Service',
    actorType: 'system',
    action: 'high CPU usage detected',
    target: 'SVC-004 — CPU at 78% (threshold: 75%)',
    severity: 'warning',
  },
];

const mockServices: ServiceSummary[] = [
  { id: 'SVC-001', name: 'User Management',      status: 'healthy',  uptime: '45d 12h', responseTime: 45,  errorRate: 0.08 },
  { id: 'SVC-002', name: 'Route Management',     status: 'healthy',  uptime: '30d 8h',  responseTime: 123, errorRate: 0.16 },
  { id: 'SVC-003', name: 'Ticketing Service',    status: 'healthy',  uptime: '22d 6h',  responseTime: 89,  errorRate: 0.08 },
  { id: 'SVC-004', name: 'Location Tracking',    status: 'degraded', uptime: '5d 2h',   responseTime: 890, errorRate: 2.70 },
  { id: 'SVC-005', name: 'Notifications',        status: 'healthy',  uptime: '60d 4h',  responseTime: 34,  errorRate: 0.04 },
  { id: 'SVC-006', name: 'Analytics',            status: 'healthy',  uptime: '25d 16h', responseTime: 156, errorRate: 0.12 },
  { id: 'SVC-007', name: 'Schedule Service',     status: 'healthy',  uptime: '35d 9h',  responseTime: 98,  errorRate: 0.07 },
  { id: 'SVC-008', name: 'Permit Service',       status: 'down',     uptime: '0d 0h',   responseTime: 0,   errorRate: 100  },
];

const mockUserDistribution: UserDistribution[] = [
  { type: 'Passengers',       count: 1890123, color: '#3b82f6' },
  { type: 'Conductors',       count: 18420,   color: '#10b981' },
  { type: 'Fleet Operators',  count: 4821,    color: '#f59e0b' },
  { type: 'Timekeepers',      count: 6340,    color: '#8b5cf6' },
  { type: 'MOT Officers',     count: 4677,    color: '#ef4444' },
];

const mockActiveAlerts: ActiveAlertEntry[] = [
  {
    id: 'ALR-002',
    title: 'Permit Service Down',
    severity: 'critical',
    source: 'SVC-008',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'ALR-001',
    title: 'High CPU — Location Tracking',
    severity: 'warning',
    source: 'SVC-004',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'ALR-004',
    title: 'API Error Rate Spike',
    severity: 'warning',
    source: 'API /api/tracking/buses',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'ALR-003',
    title: 'High Memory — Ticketing',
    severity: 'info',
    source: 'SVC-003',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

// ── Snapshot state (for simulation) ─────────────────────────────

let _kpis: KPIMetric[] = makeKPIs();
let _trendHistory: TrendPoint[] = makeTrendHistory();
let _activity: ActivityEntry[] = [...mockActivity];
let _services: ServiceSummary[] = [...mockServices];
let _userDistribution: UserDistribution[] = [...mockUserDistribution];
let _activeAlerts: ActiveAlertEntry[] = [...mockActiveAlerts];

// ── Simulation tick ──────────────────────────────────────────────

export function simulateDashboardTick(): void {
  // KPI drift
  _kpis = _kpis.map((kpi) => {
    if (kpi.id === 'kpi-users') {
      const newRaw = kpi.rawValue + rand(0, 12);
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: newRaw.toLocaleString(), sparkData: newSpark };
    }
    if (kpi.id === 'kpi-sessions') {
      const newRaw = Math.round(drift(kpi.rawValue, 40, 800, 3000));
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: newRaw.toLocaleString(), sparkData: newSpark };
    }
    if (kpi.id === 'kpi-errors') {
      const newRaw = parseFloat(drift(kpi.rawValue, 0.3, 0.2, 6.0).toFixed(1));
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      const trend: Trend = newRaw < kpi.rawValue ? 'down' : newRaw > kpi.rawValue ? 'up' : 'stable';
      return { ...kpi, rawValue: newRaw, value: `${newRaw}%`, trend, sparkData: newSpark };
    }
    if (kpi.id === 'kpi-transactions') {
      const newRaw = kpi.rawValue + rand(5000, 25000);
      const val = newRaw >= 1000000 ? `Rs ${(newRaw / 1000000).toFixed(2)}M` : `Rs ${(newRaw / 1000).toFixed(0)}K`;
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: val, sparkData: newSpark };
    }
    if (kpi.id === 'kpi-uptime') {
      const newSpark = [...kpi.sparkData.slice(1), kpi.rawValue + (Math.random() - 0.3) * 0.05];
      return { ...kpi, sparkData: newSpark };
    }
    return kpi;
  });

  // Trend history: drop oldest, append new
  const last = _trendHistory[_trendHistory.length - 1];
  const newPoint: TrendPoint = {
    label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    passengers:    Math.round(drift(last.passengers, 4000, 80000, 200000)),
    requestRate:   Math.round(drift(last.requestRate, 30, 120, 900)),
    errorRate:     parseFloat(drift(last.errorRate, 0.3, 0.1, 8.0).toFixed(1)),
    activeSessions: Math.round(drift(last.activeSessions, 60, 400, 3000)),
  };
  _trendHistory = [..._trendHistory.slice(1), newPoint];
}

// ── Public API ───────────────────────────────────────────────────

export function getDashboardKPIs(): KPIMetric[] {
  // TODO: Replace with → GET /api/dashboard/kpis
  return _kpis;
}

export function getDashboardTrends(): TrendPoint[] {
  // TODO: Replace with → GET /api/dashboard/trends?hours=24
  return _trendHistory;
}

export function getDashboardActivity(limit = 10): ActivityEntry[] {
  // TODO: Replace with → GET /api/dashboard/activity?limit=10
  return _activity.slice(0, limit);
}

export function getDashboardServices(): ServiceSummary[] {
  // TODO: Replace with → GET /api/dashboard/services
  return _services;
}

export function getDashboardUserDistribution(): UserDistribution[] {
  // TODO: Replace with → GET /api/dashboard/users/stats
  return _userDistribution;
}

export function getDashboardActiveAlerts(): ActiveAlertEntry[] {
  // TODO: Replace with → GET /api/dashboard/alerts/active
  return _activeAlerts;
}

export function getDashboardSnapshot(): DashboardSnapshot {
  // TODO: Replace with → GET /api/dashboard/snapshot (aggregated)
  return {
    kpis:             getDashboardKPIs(),
    trendHistory:     getDashboardTrends(),
    activity:         getDashboardActivity(),
    services:         getDashboardServices(),
    userDistribution: getDashboardUserDistribution(),
    activeAlerts:     getDashboardActiveAlerts(),
  };
}
