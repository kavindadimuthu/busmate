// MOT Dashboard – comprehensive mock data for MOT portal overview
// ─────────────────────────────────────────────────────────────────
// When the backend is ready, replace each function marked with TODO
// with the corresponding API fetch call. The data shapes are
// intentionally kept stable so components need no changes.
//
// Backend endpoints (planned):
//   GET /api/mot/dashboard/kpis            — KPI cards data
//   GET /api/mot/dashboard/trends          — Historical trend data
//   GET /api/mot/dashboard/activity        — Recent activity feed
//   GET /api/mot/dashboard/alerts          — Active alerts summary
//   GET /api/mot/dashboard/fleet-status    — Fleet status distribution
//   GET /api/mot/dashboard/route-status    — Route status distribution
//   GET /api/mot/dashboard/permit-status   — Permit status distribution

// ── Types ────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type OperationalStatus = 'active' | 'inactive' | 'maintenance' | 'pending';

export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: Trend;
  trendValue: string;
  /** true = up is good (e.g. buses), false = up is bad (e.g. delays) */
  trendPositiveIsGood: boolean;
  sparkData: number[]; // last 20 data points
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal';
}

export interface TrendPoint {
  label: string; // e.g. "Mon", "Tue", etc. or "14:00"
  trips: number;
  passengers: number;
  revenue: number;
  busesActive: number;
  onTimeRate: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'staff' | 'system' | 'operator' | 'driver';
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

export interface RouteStatusItem {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface PermitStatusItem {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface OperatorPerformanceItem {
  id: string;
  name: string;
  fleetSize: number;
  activeRoutes: number;
  onTimeRate: number;
  passengerSatisfaction: number;
  trend: Trend;
}

export interface RegionalDistributionItem {
  region: string;
  buses: number;
  routes: number;
  staff: number;
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
  routeStatus: RouteStatusItem[];
  permitStatus: PermitStatusItem[];
  operatorPerformance: OperatorPerformanceItem[];
  regionalDistribution: RegionalDistributionItem[];
  quickActions: QuickAction[];
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
      id: 'kpi-buses',
      label: 'Total Buses',
      value: '2,847',
      rawValue: 2847,
      unit: '',
      trend: 'up',
      trendValue: '+32 this month',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(2800, 20, 50),
      color: 'blue',
    },
    {
      id: 'kpi-active-trips',
      label: 'Active Trips',
      value: '487',
      rawValue: 487,
      unit: '',
      trend: 'up',
      trendValue: '+12.4% vs yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(450, 20, 40),
      color: 'teal',
    },
    {
      id: 'kpi-passengers',
      label: 'Today\'s Passengers',
      value: '45,231',
      rawValue: 45231,
      unit: '',
      trend: 'up',
      trendValue: '+8.2% vs last week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(42000, 20, 3000),
      color: 'green',
    },
    {
      id: 'kpi-ontime',
      label: 'On-Time Rate',
      value: '87.3%',
      rawValue: 87.3,
      unit: '%',
      trend: 'up',
      trendValue: '+2.1% improvement',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(85, 20, 3),
      color: 'purple',
    },
    {
      id: 'kpi-routes',
      label: 'Active Routes',
      value: '342',
      rawValue: 342,
      unit: '',
      trend: 'stable',
      trendValue: 'No change this week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(340, 20, 5),
      color: 'amber',
    },
    {
      id: 'kpi-revenue',
      label: 'Today\'s Revenue',
      value: 'Rs 2.4M',
      rawValue: 2400000,
      unit: 'Rs',
      trend: 'up',
      trendValue: '+15.3% vs yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(2200000, 20, 200000),
      color: 'green',
    },
  ];
}

function makeTrendHistory(): TrendPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = {
    trips: 1200,
    passengers: 42000,
    revenue: 2100000,
    busesActive: 2400,
    onTimeRate: 85,
  };

  return days.map((label, i) => ({
    label,
    trips: Math.round(base.trips + rand(-150, 200) + (i < 5 ? 100 : -200)),
    passengers: Math.round(base.passengers + rand(-5000, 8000) + (i < 5 ? 3000 : -5000)),
    revenue: Math.round(base.revenue + rand(-200000, 300000)),
    busesActive: Math.round(base.busesActive + rand(-100, 150)),
    onTimeRate: Math.round((base.onTimeRate + rand(-3, 5)) * 10) / 10,
  }));
}

function makeActivity(): ActivityEntry[] {
  return [
    {
      id: 'act-1',
      timestamp: isoMinsAgo(2),
      actor: 'System',
      actorType: 'system',
      action: 'Schedule updated',
      target: 'Route 138 (Colombo – Kandy)',
      severity: 'normal',
    },
    {
      id: 'act-2',
      timestamp: isoMinsAgo(8),
      actor: 'SLTB Western',
      actorType: 'operator',
      action: 'New bus registered',
      target: 'NW-1234 (Luxury)',
      severity: 'normal',
    },
    {
      id: 'act-3',
      timestamp: isoMinsAgo(15),
      actor: 'Driver #4521',
      actorType: 'driver',
      action: 'Trip completed',
      target: 'Trip #89456 – 12 stops, 67 passengers',
      severity: 'normal',
    },
    {
      id: 'act-4',
      timestamp: isoMinsAgo(23),
      actor: 'System',
      actorType: 'system',
      action: 'Delay detected',
      target: 'Route 101 – 18 min behind schedule',
      severity: 'warning',
    },
    {
      id: 'act-5',
      timestamp: isoMinsAgo(35),
      actor: 'Inspector Perera',
      actorType: 'staff',
      action: 'Inspection completed',
      target: 'Bus WP-3456 – Passed',
      severity: 'normal',
    },
    {
      id: 'act-6',
      timestamp: isoMinsAgo(48),
      actor: 'Private Express',
      actorType: 'operator',
      action: 'Permit renewal submitted',
      target: 'Permit #PE-2024-0892',
      severity: 'normal',
    },
    {
      id: 'act-7',
      timestamp: isoMinsAgo(62),
      actor: 'System',
      actorType: 'system',
      action: 'Maintenance alert',
      target: 'Bus WP-5678 – Service due in 3 days',
      severity: 'warning',
    },
    {
      id: 'act-8',
      timestamp: isoMinsAgo(78),
      actor: 'CTB Colombo',
      actorType: 'operator',
      action: 'Route modification',
      target: 'Route 154 – Added 2 new stops',
      severity: 'normal',
    },
  ];
}

function makeAlerts(): AlertEntry[] {
  return [
    {
      id: 'alert-1',
      title: 'Bus Breakdown',
      message: 'Bus WP-8901 reported breakdown on Route 138 near Kadawatha junction. Replacement dispatched.',
      severity: 'critical',
      source: 'Fleet Monitoring',
      createdAt: isoMinsAgo(5),
      acknowledged: false,
    },
    {
      id: 'alert-2',
      title: 'Permit Expiring',
      message: '12 permits expiring within the next 7 days. Review and process renewals.',
      severity: 'warning',
      source: 'Permit Management',
      createdAt: isoMinsAgo(45),
      acknowledged: false,
    },
    {
      id: 'alert-3',
      title: 'High Passenger Load',
      message: 'Route 101 experiencing higher than normal passenger load. Consider adding extra buses.',
      severity: 'info',
      source: 'Operations',
      createdAt: isoMinsAgo(90),
      acknowledged: true,
    },
    {
      id: 'alert-4',
      title: 'Schedule Conflict',
      message: 'Overlapping schedules detected for buses on Route 154 and 156.',
      severity: 'warning',
      source: 'Scheduling',
      createdAt: isoMinsAgo(120),
      acknowledged: false,
    },
  ];
}

function makeFleetStatus(): FleetStatusItem[] {
  const total = 2847;
  const items = [
    { label: 'Active', value: 2412, color: '#22c55e' },
    { label: 'In Maintenance', value: 187, color: '#f59e0b' },
    { label: 'Out of Service', value: 156, color: '#ef4444' },
    { label: 'Standby', value: 92, color: '#6b7280' },
  ];
  
  return items.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100 * 10) / 10,
  }));
}

function makeRouteStatus(): RouteStatusItem[] {
  const total = 342;
  const items = [
    { label: 'Operating', value: 298, color: '#22c55e' },
    { label: 'Peak Hours Only', value: 28, color: '#3b82f6' },
    { label: 'Suspended', value: 12, color: '#ef4444' },
    { label: 'Under Review', value: 4, color: '#f59e0b' },
  ];
  
  return items.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100 * 10) / 10,
  }));
}

function makePermitStatus(): PermitStatusItem[] {
  const total = 1208;
  const items = [
    { label: 'Active', value: 1089, color: '#22c55e' },
    { label: 'Pending Approval', value: 67, color: '#3b82f6' },
    { label: 'Expiring Soon', value: 34, color: '#f59e0b' },
    { label: 'Expired', value: 18, color: '#ef4444' },
  ];
  
  return items.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100 * 10) / 10,
  }));
}

function makeOperatorPerformance(): OperatorPerformanceItem[] {
  return [
    {
      id: 'op-1',
      name: 'SLTB Western',
      fleetSize: 456,
      activeRoutes: 42,
      onTimeRate: 91.2,
      passengerSatisfaction: 4.3,
      trend: 'up',
    },
    {
      id: 'op-2',
      name: 'CTB Colombo',
      fleetSize: 312,
      activeRoutes: 35,
      onTimeRate: 88.7,
      passengerSatisfaction: 4.1,
      trend: 'stable',
    },
    {
      id: 'op-3',
      name: 'Private Express',
      fleetSize: 245,
      activeRoutes: 28,
      onTimeRate: 85.4,
      passengerSatisfaction: 4.5,
      trend: 'up',
    },
    {
      id: 'op-4',
      name: 'Metro Link',
      fleetSize: 189,
      activeRoutes: 22,
      onTimeRate: 82.1,
      passengerSatisfaction: 3.9,
      trend: 'down',
    },
    {
      id: 'op-5',
      name: 'SLTB Central',
      fleetSize: 167,
      activeRoutes: 19,
      onTimeRate: 89.3,
      passengerSatisfaction: 4.2,
      trend: 'up',
    },
  ];
}

function makeRegionalDistribution(): RegionalDistributionItem[] {
  return [
    { region: 'Western Province', buses: 892, routes: 98, staff: 1245 },
    { region: 'Central Province', buses: 456, routes: 52, staff: 623 },
    { region: 'Southern Province', buses: 378, routes: 45, staff: 512 },
    { region: 'Northern Province', buses: 234, routes: 32, staff: 298 },
    { region: 'Eastern Province', buses: 289, routes: 38, staff: 356 },
    { region: 'North Western', buses: 198, routes: 28, staff: 245 },
    { region: 'Sabaragamuwa', buses: 167, routes: 24, staff: 198 },
    { region: 'Uva Province', buses: 145, routes: 18, staff: 167 },
    { region: 'North Central', buses: 88, routes: 12, staff: 112 },
  ];
}

function makeQuickActions(): QuickAction[] {
  return [
    {
      id: 'qa-1',
      label: 'Add Route',
      description: 'Create a new bus route',
      href: '/mot/routes/create',
      icon: 'route',
      color: 'blue',
    },
    {
      id: 'qa-2',
      label: 'Register Bus',
      description: 'Add new bus to fleet',
      href: '/mot/buses/create',
      icon: 'bus',
      color: 'green',
    },
    {
      id: 'qa-3',
      label: 'Manage Staff',
      description: 'View and assign staff',
      href: '/mot/staff-management',
      icon: 'users',
      color: 'purple',
    },
    {
      id: 'qa-4',
      label: 'View Permits',
      description: 'Review permit applications',
      href: '/mot/passenger-service-permits',
      icon: 'shield',
      color: 'orange',
    },
    {
      id: 'qa-5',
      label: 'Schedules',
      description: 'Manage bus schedules',
      href: '/mot/schedules',
      icon: 'calendar',
      color: 'teal',
    },
    {
      id: 'qa-6',
      label: 'Analytics',
      description: 'View detailed reports',
      href: '/mot/analytics',
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
  routeStatus: makeRouteStatus(),
  permitStatus: makePermitStatus(),
  operatorPerformance: makeOperatorPerformance(),
  regionalDistribution: makeRegionalDistribution(),
  quickActions: makeQuickActions(),
};

/**
 * TODO: Replace with a real API fetch when backend is ready:
 *
 *   export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
 *     const res = await fetch('/api/mot/dashboard/snapshot');
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
    const newSparkData = [...kpi.sparkData.slice(1), drift(kpi.sparkData[kpi.sparkData.length - 1], kpi.rawValue * 0.02, kpi.rawValue * 0.5, kpi.rawValue * 1.5)];
    
    let newRawValue = kpi.rawValue;
    let newValue = kpi.value;
    
    // Simulate small changes for some KPIs
    if (kpi.id === 'kpi-active-trips') {
      newRawValue = Math.round(drift(kpi.rawValue, 15, 400, 600));
      newValue = newRawValue.toLocaleString();
    } else if (kpi.id === 'kpi-passengers') {
      newRawValue = Math.round(drift(kpi.rawValue, 500, 40000, 55000));
      newValue = newRawValue.toLocaleString();
    } else if (kpi.id === 'kpi-ontime') {
      newRawValue = Math.round(drift(kpi.rawValue, 0.5, 80, 95) * 10) / 10;
      newValue = `${newRawValue}%`;
    }
    
    return {
      ...kpi,
      sparkData: newSparkData,
      rawValue: newRawValue,
      value: newValue,
    };
  });

  // Update trend history with slight variations
  _snapshot.trendHistory = _snapshot.trendHistory.map((point, i) => ({
    ...point,
    trips: Math.round(drift(point.trips, 20, 800, 1800)),
    passengers: Math.round(drift(point.passengers, 1000, 30000, 60000)),
    onTimeRate: Math.round(drift(point.onTimeRate, 1, 75, 95) * 10) / 10,
  }));

  // Occasionally add new activity
  if (Math.random() < 0.3) {
    const newActions = [
      { actor: 'System', actorType: 'system' as const, action: 'Trip started', target: `Trip #${rand(80000, 99999)}` },
      { actor: 'Driver #' + rand(1000, 9999), actorType: 'driver' as const, action: 'Check-in completed', target: `Bus ${['WP', 'NW', 'CP', 'SP'][rand(0, 3)]}-${rand(1000, 9999)}` },
      { actor: ['SLTB', 'CTB', 'Private'][rand(0, 2)], actorType: 'operator' as const, action: 'Schedule updated', target: `Route ${rand(100, 200)}` },
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
    routeStatus: makeRouteStatus(),
    permitStatus: makePermitStatus(),
    operatorPerformance: makeOperatorPerformance(),
    regionalDistribution: makeRegionalDistribution(),
    quickActions: makeQuickActions(),
  };
}
