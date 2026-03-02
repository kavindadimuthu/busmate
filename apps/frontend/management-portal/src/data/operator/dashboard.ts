// Operator Dashboard – comprehensive mock data for operator portal overview
// ─────────────────────────────────────────────────────────────────────────
// When the backend is ready, replace each function marked with TODO
// with the corresponding API fetch call. The data shapes are
// intentionally kept stable so components need no changes.
//
// Backend endpoints (planned):
//   GET /api/operator/dashboard/kpis              — KPI cards data
//   GET /api/operator/dashboard/trends            — Historical trend data
//   GET /api/operator/dashboard/activity          — Recent activity feed
//   GET /api/operator/dashboard/alerts            — Active alerts
//   GET /api/operator/dashboard/fleet-status      — Fleet status distribution
//   GET /api/operator/dashboard/route-performance — Route performance list
//   GET /api/operator/dashboard/staff-status      — Staff on duty overview

// ── Types ────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: Trend;
  trendValue: string;
  /** true = up is good (e.g. revenue), false = up is bad (e.g. breakdowns) */
  trendPositiveIsGood: boolean;
  sparkData: number[];
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal';
}

export interface TrendPoint {
  label: string;
  trips: number;
  passengers: number;
  revenue: number;
  onTimeRate: number;
  fuelCost: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'driver' | 'conductor' | 'system' | 'staff';
  action: string;
  target: string;
  severity: 'normal' | 'warning' | 'critical';
}

export interface AlertEntry {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface FleetStatusItem {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface RoutePerformanceItem {
  id: string;
  routeNumber: string;
  routeName: string;
  tripsToday: number;
  passengers: number;
  revenue: number;
  onTimeRate: number;
  trend: Trend;
}

export interface StaffStatusItem {
  label: string;
  value: number;
  color: string;
  icon: 'driver' | 'conductor' | 'leave' | 'total';
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

export interface DashboardSnapshot {
  kpis: KPIMetric[];
  trendHistory: TrendPoint[];
  activity: ActivityEntry[];
  alerts: AlertEntry[];
  fleetStatus: FleetStatusItem[];
  routePerformance: RoutePerformanceItem[];
  staffStatus: StaffStatusItem[];
  quickActions: QuickAction[];
}

// ── Helpers ──────────────────────────────────────────────────────

function rand(min: number, max: number): number {
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

function isoNow(): string {
  return new Date().toISOString();
}

function isoMinsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString();
}

// ── Mock data generators ─────────────────────────────────────────

function makeKPIs(): KPIMetric[] {
  return [
    {
      id: 'kpi-fleet',
      label: 'Total Fleet',
      value: '32',
      rawValue: 32,
      unit: '',
      trend: 'up',
      trendValue: '+2 this month',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(30, 20, 2),
      color: 'blue',
    },
    {
      id: 'kpi-revenue',
      label: "Today's Revenue",
      value: 'Rs 245,320',
      rawValue: 245320,
      unit: 'Rs',
      trend: 'up',
      trendValue: '+12.3% vs yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(220000, 20, 15000),
      color: 'green',
    },
    {
      id: 'kpi-active-trips',
      label: 'Active Trips',
      value: '18',
      rawValue: 18,
      unit: '',
      trend: 'up',
      trendValue: '+3 vs last hour',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(15, 20, 3),
      color: 'teal',
    },
    {
      id: 'kpi-ontime',
      label: 'On-Time Rate',
      value: '87.4%',
      rawValue: 87.4,
      unit: '%',
      trend: 'up',
      trendValue: '+2.1% this week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(85, 20, 3),
      color: 'purple',
    },
    {
      id: 'kpi-staff',
      label: 'Staff On Duty',
      value: '54',
      rawValue: 54,
      unit: '',
      trend: 'stable',
      trendValue: 'No change today',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(52, 20, 4),
      color: 'amber',
    },
    {
      id: 'kpi-maintenance',
      label: 'Maintenance Due',
      value: '5',
      rawValue: 5,
      unit: '',
      trend: 'up',
      trendValue: '2 urgent',
      trendPositiveIsGood: false,
      sparkData: sparkSeries(4, 20, 1),
      color: 'red',
    },
  ];
}

function makeTrendHistory(): TrendPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = { trips: 72, passengers: 3200, revenue: 210000, onTimeRate: 86, fuelCost: 28000 };

  return days.map((label, i) => ({
    label,
    trips: Math.round(base.trips + rand(-8, 12) + (i < 5 ? 5 : -10)),
    passengers: Math.round(base.passengers + rand(-400, 600) + (i < 5 ? 300 : -500)),
    revenue: Math.round(base.revenue + rand(-20000, 30000)),
    onTimeRate: Math.round((base.onTimeRate + rand(-4, 6)) * 10) / 10,
    fuelCost: Math.round(base.fuelCost + rand(-2000, 3000)),
  }));
}

function makeActivity(): ActivityEntry[] {
  return [
    {
      id: 'act-1',
      timestamp: isoMinsAgo(3),
      actor: 'Kamal Silva',
      actorType: 'driver',
      action: 'Trip started',
      target: 'Bus LA-1234 – Route 120 (Colombo → Kandy)',
      severity: 'normal',
    },
    {
      id: 'act-2',
      timestamp: isoMinsAgo(11),
      actor: 'System',
      actorType: 'system',
      action: 'Maintenance alert triggered',
      target: 'Bus LA-9012 – Oil service due in 2 days',
      severity: 'warning',
    },
    {
      id: 'act-3',
      timestamp: isoMinsAgo(19),
      actor: 'Nimal Perera',
      actorType: 'conductor',
      action: 'Trip completed',
      target: 'Trip #45321 – 34 passengers, Rs 8,450 collected',
      severity: 'normal',
    },
    {
      id: 'act-4',
      timestamp: isoMinsAgo(32),
      actor: 'System',
      actorType: 'system',
      action: 'Delay detected',
      target: 'Bus LA-5678 – Route 130, 14 min behind schedule',
      severity: 'warning',
    },
    {
      id: 'act-5',
      timestamp: isoMinsAgo(47),
      actor: 'Sunil Fernando',
      actorType: 'driver',
      action: 'Check-in completed',
      target: 'Bus LA-3456 – Route 145 starting at 08:30',
      severity: 'normal',
    },
    {
      id: 'act-6',
      timestamp: isoMinsAgo(63),
      actor: 'Ranjan Kumar',
      actorType: 'conductor',
      action: 'Incident reported',
      target: 'Bus LA-5678 – Minor passenger dispute resolved',
      severity: 'warning',
    },
    {
      id: 'act-7',
      timestamp: isoMinsAgo(88),
      actor: 'System',
      actorType: 'system',
      action: 'Permit renewed',
      target: 'Bus LA-2345 – Permit valid until 2026-12-31',
      severity: 'normal',
    },
    {
      id: 'act-8',
      timestamp: isoMinsAgo(105),
      actor: 'Asanka Mendis',
      actorType: 'driver',
      action: 'Check-out completed',
      target: 'Bus LA-7890 – Shift ended, 6 trips completed',
      severity: 'normal',
    },
  ];
}

function makeAlerts(): AlertEntry[] {
  return [
    {
      id: 'alert-1',
      title: 'Bus Breakdown',
      message: 'Bus LA-7890 reported a breakdown near Kadawatha. Replacement bus dispatched. Passengers transferred.',
      severity: 'critical',
      source: 'Driver Report',
      createdAt: isoMinsAgo(7),
      acknowledged: false,
    },
    {
      id: 'alert-2',
      title: 'Low Fuel Warning',
      message: 'Bus LA-5678 fuel level at 12%. Nearest fuel station: Kalutara (8 km).',
      severity: 'warning',
      source: 'Fleet Monitoring',
      createdAt: isoMinsAgo(22),
      acknowledged: false,
    },
    {
      id: 'alert-3',
      title: 'Maintenance Overdue',
      message: 'Bus LA-9012 annual service is 3 days overdue. Schedule service immediately.',
      severity: 'critical',
      source: 'Maintenance System',
      createdAt: isoMinsAgo(180),
      acknowledged: false,
    },
    {
      id: 'alert-4',
      title: 'Schedule Deviation',
      message: 'Bus LA-1234 is 18 min behind schedule on Route 120. Passengers notified via app.',
      severity: 'warning',
      source: 'Scheduling',
      createdAt: isoMinsAgo(240),
      acknowledged: true,
    },
  ];
}

function makeFleetStatus(): FleetStatusItem[] {
  const total = 32;
  const items = [
    { label: 'Active',       value: 18, color: '#22c55e' },
    { label: 'Idle',         value: 6,  color: '#6b7280' },
    { label: 'Maintenance',  value: 5,  color: '#f59e0b' },
    { label: 'Out of Service', value: 3, color: '#ef4444' },
  ];
  return items.map((item) => ({
    ...item,
    percentage: Math.round((item.value / total) * 100 * 10) / 10,
  }));
}

function makeRoutePerformance(): RoutePerformanceItem[] {
  return [
    {
      id: 'rt-1',
      routeNumber: '120',
      routeName: 'Colombo → Kandy',
      tripsToday: 12,
      passengers: 820,
      revenue: 68400,
      onTimeRate: 91.7,
      trend: 'up',
    },
    {
      id: 'rt-2',
      routeNumber: '130',
      routeName: 'Colombo → Galle',
      tripsToday: 10,
      passengers: 670,
      revenue: 52300,
      onTimeRate: 83.2,
      trend: 'down',
    },
    {
      id: 'rt-3',
      routeNumber: '145',
      routeName: 'Colombo → Negombo',
      tripsToday: 14,
      passengers: 540,
      revenue: 38900,
      onTimeRate: 88.5,
      trend: 'stable',
    },
    {
      id: 'rt-4',
      routeNumber: '156',
      routeName: 'Kandy → Matale',
      tripsToday: 8,
      passengers: 310,
      revenue: 18200,
      onTimeRate: 95.0,
      trend: 'up',
    },
    {
      id: 'rt-5',
      routeNumber: '162',
      routeName: 'Galle → Matara',
      tripsToday: 9,
      passengers: 420,
      revenue: 29400,
      onTimeRate: 79.6,
      trend: 'down',
    },
  ];
}

function makeStaffStatus(): StaffStatusItem[] {
  return [
    { label: 'Total Staff',   value: 68, color: '#3b82f6', icon: 'total' },
    { label: 'Drivers',       value: 32, color: '#14b8a6', icon: 'driver' },
    { label: 'Conductors',    value: 30, color: '#a855f7', icon: 'conductor' },
    { label: 'On Leave',      value: 4,  color: '#f59e0b', icon: 'leave' },
  ];
}

function makeQuickActions(): QuickAction[] {
  return [
    {
      id: 'qa-1',
      label: 'Add Bus',
      description: 'Register a new bus',
      href: '/operator/fleet/create',
      icon: 'bus',
      color: 'blue',
    },
    {
      id: 'qa-2',
      label: 'Schedule Trip',
      description: 'Plan a new trip',
      href: '/operator/trips/create',
      icon: 'calendar',
      color: 'green',
    },
    {
      id: 'qa-3',
      label: 'Manage Staff',
      description: 'View drivers & conductors',
      href: '/operator/staff-management',
      icon: 'users',
      color: 'purple',
    },
    {
      id: 'qa-4',
      label: 'View Routes',
      description: 'Your assigned routes',
      href: '/operator/routes',
      icon: 'route',
      color: 'teal',
    },
    {
      id: 'qa-5',
      label: 'Maintenance',
      description: 'Schedule bus service',
      href: '/operator/fleet?tab=maintenance',
      icon: 'wrench',
      color: 'orange',
    },
    {
      id: 'qa-6',
      label: 'Reports',
      description: 'Revenue & trip reports',
      href: '/operator/reports',
      icon: 'activity',
      color: 'red',
    },
  ];
}

// ── Snapshot state (simulates backend) ───────────────────────────

let _snapshot: DashboardSnapshot = {
  kpis: makeKPIs(),
  trendHistory: makeTrendHistory(),
  activity: makeActivity(),
  alerts: makeAlerts(),
  fleetStatus: makeFleetStatus(),
  routePerformance: makeRoutePerformance(),
  staffStatus: makeStaffStatus(),
  quickActions: makeQuickActions(),
};

/**
 * TODO: Replace with a real API fetch when backend is ready:
 *
 *   export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
 *     const res = await fetch('/api/operator/dashboard/snapshot');
 *     if (!res.ok) throw new Error('Failed to fetch dashboard data');
 *     return res.json();
 *   }
 */
export function getDashboardSnapshot(): DashboardSnapshot {
  return _snapshot;
}

/**
 * Simulates real-time updates by slightly mutating values.
 * Call this on each interval tick before reading the snapshot.
 */
export function simulateDashboardTick(): void {
  // Update KPI spark data and values
  _snapshot.kpis = _snapshot.kpis.map((kpi) => {
    const newSparkData = [
      ...kpi.sparkData.slice(1),
      drift(kpi.sparkData[kpi.sparkData.length - 1], kpi.rawValue * 0.02, kpi.rawValue * 0.5, kpi.rawValue * 1.5),
    ];

    let newRawValue = kpi.rawValue;
    let newValue = kpi.value;

    if (kpi.id === 'kpi-active-trips') {
      newRawValue = Math.round(drift(kpi.rawValue, 2, 10, 28));
      newValue = String(newRawValue);
    } else if (kpi.id === 'kpi-revenue') {
      newRawValue = Math.round(drift(kpi.rawValue, 5000, 180000, 320000));
      newValue = `Rs ${newRawValue.toLocaleString()}`;
    } else if (kpi.id === 'kpi-ontime') {
      newRawValue = Math.round(drift(kpi.rawValue, 0.5, 78, 96) * 10) / 10;
      newValue = `${newRawValue}%`;
    }

    return { ...kpi, sparkData: newSparkData, rawValue: newRawValue, value: newValue };
  });

  // Update trend history
  _snapshot.trendHistory = _snapshot.trendHistory.map((point) => ({
    ...point,
    trips: Math.round(drift(point.trips, 3, 50, 100)),
    passengers: Math.round(drift(point.passengers, 150, 2000, 5000)),
    onTimeRate: Math.round(drift(point.onTimeRate, 1, 75, 97) * 10) / 10,
  }));

  // Occasionally add new activity
  if (Math.random() < 0.3) {
    const newActions = [
      { actor: 'Kamal Silva', actorType: 'driver' as const, action: 'Trip started', target: `Bus LA-${rand(1000, 9999)} – Route ${rand(120, 165)}` },
      { actor: 'Nimal Perera', actorType: 'conductor' as const, action: 'Fare collected', target: `Rs ${rand(5000, 12000).toLocaleString()} – ${rand(20, 50)} passengers` },
      { actor: 'System', actorType: 'system' as const, action: 'GPS updated', target: `Bus LA-${rand(1000, 9999)} – Location synced` },
    ];
    const newAct = newActions[rand(0, newActions.length - 1)];

    _snapshot.activity = [
      {
        id: `act-${Date.now()}`,
        timestamp: isoNow(),
        severity: 'normal',
        ...newAct,
      },
      ..._snapshot.activity.slice(0, 7),
    ];
  }
}

/**
 * Acknowledge an alert by ID.
 */
export function acknowledgeAlert(alertId: string): void {
  _snapshot.alerts = _snapshot.alerts.map((alert) =>
    alert.id === alertId ? { ...alert, acknowledged: true } : alert
  );
}

/**
 * Reset mock data (useful for testing).
 */
export function resetDashboardData(): void {
  _snapshot = {
    kpis: makeKPIs(),
    trendHistory: makeTrendHistory(),
    activity: makeActivity(),
    alerts: makeAlerts(),
    fleetStatus: makeFleetStatus(),
    routePerformance: makeRoutePerformance(),
    staffStatus: makeStaffStatus(),
    quickActions: makeQuickActions(),
  };
}
