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
//   GET /api/dashboard/users/stats   — User distribution

// ── Types ────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';

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

export interface UserDistribution {
  type: string;
  count: number;
  color: string;
}

export interface DashboardSnapshot {
  kpis: KPIMetric[];
  trendHistory: TrendPoint[];
  activity: ActivityEntry[];
  userDistribution: UserDistribution[];
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
  let pass = 145000, sess = 1100;

  for (let i = 23; i >= 0; i--) {
    const dt = new Date(now - i * 3600 * 1000);
    const hour = dt.getHours();
    const label = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulate traffic patterns (peak at 8am and 5pm)
    const peakFactor = hour >= 7 && hour <= 9 ? 1.4 : hour >= 16 && hour <= 18 ? 1.3 : 1.0;

    pass = Math.round(drift(pass, 5000 * peakFactor, 80000, 200000));
    sess = Math.round(drift(sess, 100 * peakFactor, 400, 3000));

    points.push({ label, passengers: pass, activeSessions: sess });
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
];

const mockUserDistribution: UserDistribution[] = [
  { type: 'Passengers',       count: 1890123, color: '#3b82f6' },
  { type: 'Conductors',       count: 18420,   color: '#10b981' },
  { type: 'Fleet Operators',  count: 4821,    color: '#f59e0b' },
  { type: 'Timekeepers',      count: 6340,    color: '#8b5cf6' },
  { type: 'MOT Officers',     count: 4677,    color: '#ef4444' },
];

// ── Snapshot state (for simulation) ─────────────────────────────

let _kpis: KPIMetric[] = makeKPIs();
let _trendHistory: TrendPoint[] = makeTrendHistory();
const _activity: ActivityEntry[] = [...mockActivity];
const _userDistribution: UserDistribution[] = [...mockUserDistribution];

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
    if (kpi.id === 'kpi-transactions') {
      const newRaw = kpi.rawValue + rand(5000, 25000);
      const val = newRaw >= 1000000 ? `Rs ${(newRaw / 1000000).toFixed(2)}M` : `Rs ${(newRaw / 1000).toFixed(0)}K`;
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: val, sparkData: newSpark };
    }
    return kpi;
  });

  // Trend history: drop oldest, append new
  const last = _trendHistory[_trendHistory.length - 1];
  const newPoint: TrendPoint = {
    label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    passengers:    Math.round(drift(last.passengers, 4000, 80000, 200000)),
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

export function getDashboardUserDistribution(): UserDistribution[] {
  // TODO: Replace with → GET /api/dashboard/users/stats
  return _userDistribution;
}

export function getDashboardSnapshot(): DashboardSnapshot {
  // TODO: Replace with → GET /api/dashboard/snapshot (aggregated)
  return {
    kpis:             getDashboardKPIs(),
    trendHistory:     getDashboardTrends(),
    activity:         getDashboardActivity(),
    userDistribution: getDashboardUserDistribution(),
  };
}
