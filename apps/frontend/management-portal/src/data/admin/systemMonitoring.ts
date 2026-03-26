// System Monitoring mock data for admin portal
// Replace these functions with API calls when backend is ready
//
// This module provides simulated real-time system monitoring data
// including performance metrics, resource usage, API monitoring, and alerts.
//
// Backend API endpoints (when ready):
//   GET /api/dashboard/health         — Comprehensive health check
//   GET /api/dashboard/status         — System status with health score
//   GET /api/dashboard/overview       — Entity counts, activity, health
//   GET /api/health                   — Basic health check
//   GET /api/health/info              — Service version/build info
//   GET /api/health/live              — Liveness probe
//   GET /api/health/ready             — Readiness probe

// ── Types ────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'down';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type MetricTrend = 'up' | 'down' | 'stable';

export interface PerformanceSnapshot {
  timestamp: string;
  cpuUsage: number;        // percentage 0-100
  memoryUsage: number;     // percentage 0-100
  avgResponseTime: number; // ms
  requestRate: number;     // requests per second
  errorRate: number;       // percentage 0-100
  activeConnections: number;
}

export interface ResourceSnapshot {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskUsage: number;
  diskUsedGB: number;
  diskTotalGB: number;
  networkInMbps: number;
  networkOutMbps: number;
  dbConnections: number;
  dbMaxConnections: number;
  activeSessions: number;
}

export interface ApiEndpointMetric {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: ServiceStatus;
  avgResponseTime: number;    // ms
  p95ResponseTime: number;    // ms
  p99ResponseTime: number;    // ms
  requestCount24h: number;
  errorCount24h: number;
  errorRate: number;          // percentage
  uptime: number;             // percentage
  lastChecked: string;
  statusCode: number;
  responseTimeSeries: { timestamp: string; value: number }[];
}

export interface MicroserviceInfo {
  id: string;
  name: string;
  status: ServiceStatus;
  version: string;
  port: number;
  instances: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedMB: number;
  uptime: string;
  lastRestart: string;
  healthEndpoint: string;
  tags: string[];
}

export interface MonitoringAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: string;
  threshold: number;
  currentValue: number;
  unit: string;
  source: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
  notifyChannels: ('email' | 'sms' | 'slack' | 'in-app')[];
  lastTriggered?: string;
  triggerCount: number;
}

export interface SystemHealthSummary {
  overallStatus: ServiceStatus;
  healthScore: number;          // 0-100
  uptimePercentage: number;
  totalApis: number;
  healthyApis: number;
  degradedApis: number;
  downApis: number;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  activeAlerts: number;
  criticalAlerts: number;
  avgResponseTime: number;
  currentCpu: number;
  currentMemory: number;
  currentDisk: number;
  requestRate: number;
  errorRate: number;
}

// ── Random helpers ───────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function drift(current: number, amount: number, min: number, max: number): number {
  const change = (Math.random() - 0.5) * 2 * amount;
  return clamp(Math.round((current + change) * 10) / 10, min, max);
}

// ── Mock Data Generators ─────────────────────────────────────────

function generatePerformanceHistory(hours: number): PerformanceSnapshot[] {
  const now = Date.now();
  const points: PerformanceSnapshot[] = [];
  let cpu = 42, mem = 65, rt = 145, rr = 340, er = 1.2, ac = 890;

  for (let i = hours * 12; i >= 0; i--) {
    const ts = new Date(now - i * 5 * 60 * 1000).toISOString(); // every 5 mins
    cpu = drift(cpu, 8, 15, 92);
    mem = drift(mem, 4, 40, 88);
    rt = drift(rt, 30, 50, 800);
    rr = drift(rr, 50, 100, 800);
    er = clamp(drift(er, 0.8, 0, 12), 0, 15);
    ac = Math.round(drift(ac, 80, 200, 2000));
    points.push({
      timestamp: ts,
      cpuUsage: cpu,
      memoryUsage: mem,
      avgResponseTime: rt,
      requestRate: rr,
      errorRate: er,
      activeConnections: ac,
    });
  }
  return points;
}

function generateResourceHistory(hours: number): ResourceSnapshot[] {
  const now = Date.now();
  const points: ResourceSnapshot[] = [];
  let cpu = 38, mem = 62, disk = 45, netIn = 145, netOut = 89, dbConn = 45, sessions = 1240;

  for (let i = hours * 12; i >= 0; i--) {
    const ts = new Date(now - i * 5 * 60 * 1000).toISOString();
    cpu = drift(cpu, 6, 10, 95);
    mem = drift(mem, 3, 35, 90);
    disk = drift(disk, 0.5, 30, 85);
    netIn = drift(netIn, 20, 30, 500);
    netOut = drift(netOut, 15, 10, 300);
    dbConn = Math.round(drift(dbConn, 8, 5, 95));
    sessions = Math.round(drift(sessions, 120, 200, 3000));

    points.push({
      timestamp: ts,
      cpuUsage: cpu,
      memoryUsage: mem,
      memoryUsedGB: parseFloat((mem * 0.32).toFixed(1)),
      memoryTotalGB: 32,
      diskUsage: disk,
      diskUsedGB: parseFloat((disk * 5).toFixed(1)),
      diskTotalGB: 500,
      networkInMbps: netIn,
      networkOutMbps: netOut,
      dbConnections: dbConn,
      dbMaxConnections: 100,
      activeSessions: sessions,
    });
  }
  return points;
}

const mockApiEndpoints: ApiEndpointMetric[] = [
  {
    id: 'API-001',
    name: 'User Authentication',
    method: 'POST',
    endpoint: '/api/auth/login',
    status: 'healthy',
    avgResponseTime: 45,
    p95ResponseTime: 120,
    p99ResponseTime: 250,
    requestCount24h: 15847,
    errorCount24h: 12,
    errorRate: 0.08,
    uptime: 99.98,
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-002',
    name: 'Route Management',
    method: 'GET',
    endpoint: '/api/routes',
    status: 'healthy',
    avgResponseTime: 123,
    p95ResponseTime: 340,
    p99ResponseTime: 520,
    requestCount24h: 28593,
    errorCount24h: 45,
    errorRate: 0.16,
    uptime: 99.95,
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-003',
    name: 'Ticketing Service',
    method: 'POST',
    endpoint: '/api/tickets',
    status: 'healthy',
    avgResponseTime: 89,
    p95ResponseTime: 200,
    p99ResponseTime: 380,
    requestCount24h: 35891,
    errorCount24h: 28,
    errorRate: 0.08,
    uptime: 99.92,
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-004',
    name: 'Location Tracking',
    method: 'GET',
    endpoint: '/api/tracking/buses',
    status: 'degraded',
    avgResponseTime: 890,
    p95ResponseTime: 1800,
    p99ResponseTime: 3200,
    requestCount24h: 45693,
    errorCount24h: 1234,
    errorRate: 2.7,
    uptime: 97.84,
    lastChecked: new Date(Date.now() - 300000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-005',
    name: 'Schedule Management',
    method: 'GET',
    endpoint: '/api/schedules',
    status: 'healthy',
    avgResponseTime: 156,
    p95ResponseTime: 380,
    p99ResponseTime: 600,
    requestCount24h: 18234,
    errorCount24h: 15,
    errorRate: 0.08,
    uptime: 99.89,
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-006',
    name: 'Dashboard Overview',
    method: 'GET',
    endpoint: '/api/dashboard/overview',
    status: 'healthy',
    avgResponseTime: 234,
    p95ResponseTime: 500,
    p99ResponseTime: 780,
    requestCount24h: 6432,
    errorCount24h: 8,
    errorRate: 0.12,
    uptime: 99.76,
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-007',
    name: 'Operator Management',
    method: 'GET',
    endpoint: '/api/operators',
    status: 'healthy',
    avgResponseTime: 67,
    p95ResponseTime: 150,
    p99ResponseTime: 290,
    requestCount24h: 12094,
    errorCount24h: 5,
    errorRate: 0.04,
    uptime: 99.97,
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-008',
    name: 'Health Check',
    method: 'GET',
    endpoint: '/api/health',
    status: 'healthy',
    avgResponseTime: 12,
    p95ResponseTime: 25,
    p99ResponseTime: 45,
    requestCount24h: 86400,
    errorCount24h: 2,
    errorRate: 0.002,
    uptime: 99.99,
    lastChecked: new Date(Date.now() - 30000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-009',
    name: 'Bus Stop Management',
    method: 'GET',
    endpoint: '/api/bus-stops',
    status: 'healthy',
    avgResponseTime: 98,
    p95ResponseTime: 220,
    p99ResponseTime: 400,
    requestCount24h: 9821,
    errorCount24h: 7,
    errorRate: 0.07,
    uptime: 99.93,
    lastChecked: new Date(Date.now() - 90000).toISOString(),
    statusCode: 200,
    responseTimeSeries: [],
  },
  {
    id: 'API-010',
    name: 'Permit Service',
    method: 'GET',
    endpoint: '/api/permits',
    status: 'down',
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    requestCount24h: 4230,
    errorCount24h: 890,
    errorRate: 21.04,
    uptime: 94.2,
    lastChecked: new Date(Date.now() - 600000).toISOString(),
    statusCode: 503,
    responseTimeSeries: [],
  },
];

// Fill response time series for each endpoint
mockApiEndpoints.forEach((ep) => {
  const now = Date.now();
  ep.responseTimeSeries = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600 * 1000).toISOString(),
    value: ep.status === 'down'
      ? (i > 20 ? 0 : drift(ep.avgResponseTime, ep.avgResponseTime * 0.3, 10, 5000))
      : drift(ep.avgResponseTime, ep.avgResponseTime * 0.3, 10, 5000),
  }));
});

const mockMicroservices: MicroserviceInfo[] = [
  {
    id: 'SVC-001', name: 'User Management Service', status: 'healthy', version: 'v2.3.1',
    port: 8081, instances: 3, cpuUsage: 23, memoryUsage: 45, memoryUsedMB: 1440,
    uptime: '45d 12h', lastRestart: '2026-01-07T03:00:00Z',
    healthEndpoint: '/api/health', tags: ['core', 'auth'],
  },
  {
    id: 'SVC-002', name: 'Route Management Service', status: 'healthy', version: 'v1.8.4',
    port: 8082, instances: 2, cpuUsage: 35, memoryUsage: 52, memoryUsedMB: 1664,
    uptime: '30d 8h', lastRestart: '2026-01-22T04:00:00Z',
    healthEndpoint: '/api/health', tags: ['core', 'routes'],
  },
  {
    id: 'SVC-003', name: 'Ticketing Service', status: 'healthy', version: 'v3.1.0',
    port: 8083, instances: 4, cpuUsage: 42, memoryUsage: 58, memoryUsedMB: 1856,
    uptime: '22d 6h', lastRestart: '2026-01-30T02:30:00Z',
    healthEndpoint: '/api/health', tags: ['core', 'payments'],
  },
  {
    id: 'SVC-004', name: 'Location Tracking Service', status: 'degraded', version: 'v2.0.3',
    port: 8084, instances: 2, cpuUsage: 78, memoryUsage: 85, memoryUsedMB: 2720,
    uptime: '5d 2h', lastRestart: '2026-02-16T10:45:00Z',
    healthEndpoint: '/api/health', tags: ['tracking', 'gps'],
  },
  {
    id: 'SVC-005', name: 'Notification Service', status: 'healthy', version: 'v1.5.2',
    port: 8085, instances: 2, cpuUsage: 18, memoryUsage: 32, memoryUsedMB: 1024,
    uptime: '60d 4h', lastRestart: '2025-12-23T05:00:00Z',
    healthEndpoint: '/api/health', tags: ['notifications', 'messaging'],
  },
  {
    id: 'SVC-006', name: 'Analytics Service', status: 'healthy', version: 'v1.2.1',
    port: 8086, instances: 1, cpuUsage: 55, memoryUsage: 68, memoryUsedMB: 2176,
    uptime: '25d 16h', lastRestart: '2026-01-27T03:15:00Z',
    healthEndpoint: '/api/health', tags: ['analytics', 'reporting'],
  },
  {
    id: 'SVC-007', name: 'Schedule Service', status: 'healthy', version: 'v1.9.2',
    port: 8087, instances: 2, cpuUsage: 31, memoryUsage: 48, memoryUsedMB: 1536,
    uptime: '35d 9h', lastRestart: '2026-01-17T03:45:00Z',
    healthEndpoint: '/api/health', tags: ['core', 'schedules'],
  },
  {
    id: 'SVC-008', name: 'Permit Service', status: 'down', version: 'v1.1.0',
    port: 8088, instances: 0, cpuUsage: 0, memoryUsage: 0, memoryUsedMB: 0,
    uptime: '0d 0h', lastRestart: '2026-02-21T08:30:00Z',
    healthEndpoint: '/api/health', tags: ['permits', 'compliance'],
  },
];

const mockAlerts: MonitoringAlert[] = [
  {
    id: 'ALR-001', title: 'High CPU Usage — Location Tracking',
    message: 'CPU usage for Location Tracking Service exceeded 75% threshold for over 10 minutes.',
    severity: 'warning', status: 'active', metric: 'cpu_usage',
    threshold: 75, currentValue: 78, unit: '%', source: 'Location Tracking Service',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'ALR-002', title: 'Permit Service Down',
    message: 'Permit Service is not responding to health checks. All instances are unreachable.',
    severity: 'critical', status: 'active', metric: 'service_status',
    threshold: 1, currentValue: 0, unit: 'instances', source: 'Permit Service',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'ALR-003', title: 'High Memory Usage — Ticketing Service',
    message: 'Memory usage has been consistently above 80% for the last 30 minutes.',
    severity: 'warning', status: 'acknowledged', metric: 'memory_usage',
    threshold: 80, currentValue: 85, unit: '%', source: 'Ticketing Service',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    acknowledgedBy: 'admin@busmate.lk',
  },
  {
    id: 'ALR-004', title: 'API Error Rate Spike — Location Tracking',
    message: 'Error rate for /api/tracking/buses exceeded 2% threshold.',
    severity: 'warning', status: 'active', metric: 'error_rate',
    threshold: 2, currentValue: 2.7, unit: '%', source: 'Location Tracking API',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'ALR-005', title: 'Slow Response Time — Dashboard API',
    message: 'Average response time exceeded 200ms threshold.',
    severity: 'info', status: 'resolved', metric: 'response_time',
    threshold: 200, currentValue: 234, unit: 'ms', source: 'Dashboard Overview API',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'ALR-006', title: 'Database Connection Pool Near Capacity',
    message: 'Database connections at 89/100. Approaching maximum pool size.',
    severity: 'warning', status: 'resolved', metric: 'db_connections',
    threshold: 85, currentValue: 89, unit: 'connections', source: 'Database Pool',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'ALR-007', title: 'Disk Usage Warning',
    message: 'Disk usage on primary storage exceeded 70% threshold.',
    severity: 'info', status: 'resolved', metric: 'disk_usage',
    threshold: 70, currentValue: 72, unit: '%', source: 'Primary Storage',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
];

const mockAlertRules: AlertRule[] = [
  {
    id: 'RULE-001', name: 'High CPU Alert', metric: 'cpu_usage',
    condition: 'above', threshold: 80, unit: '%', severity: 'warning',
    enabled: true, cooldownMinutes: 10,
    notifyChannels: ['email', 'slack', 'in-app'], triggerCount: 12,
    lastTriggered: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'RULE-002', name: 'Critical CPU Alert', metric: 'cpu_usage',
    condition: 'above', threshold: 95, unit: '%', severity: 'critical',
    enabled: true, cooldownMinutes: 5,
    notifyChannels: ['email', 'sms', 'slack', 'in-app'], triggerCount: 2,
    lastTriggered: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
  },
  {
    id: 'RULE-003', name: 'High Memory Alert', metric: 'memory_usage',
    condition: 'above', threshold: 80, unit: '%', severity: 'warning',
    enabled: true, cooldownMinutes: 15,
    notifyChannels: ['email', 'in-app'], triggerCount: 8,
    lastTriggered: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'RULE-004', name: 'Service Down Alert', metric: 'service_status',
    condition: 'equals', threshold: 0, unit: 'instances', severity: 'critical',
    enabled: true, cooldownMinutes: 1,
    notifyChannels: ['email', 'sms', 'slack', 'in-app'], triggerCount: 3,
    lastTriggered: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'RULE-005', name: 'High Error Rate', metric: 'error_rate',
    condition: 'above', threshold: 2, unit: '%', severity: 'warning',
    enabled: true, cooldownMinutes: 10,
    notifyChannels: ['email', 'slack'], triggerCount: 5,
    lastTriggered: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'RULE-006', name: 'Slow Response Time', metric: 'response_time',
    condition: 'above', threshold: 500, unit: 'ms', severity: 'info',
    enabled: true, cooldownMinutes: 30,
    notifyChannels: ['in-app'], triggerCount: 18,
  },
  {
    id: 'RULE-007', name: 'Disk Space Warning', metric: 'disk_usage',
    condition: 'above', threshold: 80, unit: '%', severity: 'warning',
    enabled: true, cooldownMinutes: 60,
    notifyChannels: ['email', 'in-app'], triggerCount: 1,
  },
  {
    id: 'RULE-008', name: 'Low Uptime Alert', metric: 'uptime',
    condition: 'below', threshold: 99, unit: '%', severity: 'critical',
    enabled: false, cooldownMinutes: 60,
    notifyChannels: ['email', 'sms'], triggerCount: 0,
  },
];

// ── Cached data for real-time simulation ─────────────────────────

let performanceHistory = generatePerformanceHistory(4); // 4 hours
let resourceHistory = generateResourceHistory(4);

// ── Public API functions ─────────────────────────────────────────
// Each function has a TODO comment indicating the real API endpoint

export function getPerformanceHistory(hours: number = 4): PerformanceSnapshot[] {
  // TODO: Replace with API call → GET /api/dashboard/kpis/performance
  return performanceHistory.slice(-(hours * 12));
}

export function getLatestPerformance(): PerformanceSnapshot {
  // TODO: Replace with API call → GET /api/dashboard/status
  return performanceHistory[performanceHistory.length - 1];
}

export function getResourceHistory(hours: number = 4): ResourceSnapshot[] {
  // TODO: Replace with API call → GET /api/dashboard/overview
  return resourceHistory.slice(-(hours * 12));
}

export function getLatestResource(): ResourceSnapshot {
  // TODO: Replace with API call → GET /api/dashboard/status
  return resourceHistory[resourceHistory.length - 1];
}

export function getApiEndpointMetrics(): ApiEndpointMetric[] {
  // TODO: Replace with API call → GET /api/dashboard/health
  return [...mockApiEndpoints];
}

export function getApiEndpointMetricById(id: string): ApiEndpointMetric | undefined {
  // TODO: Replace with API call → GET /api/health/ready
  return mockApiEndpoints.find((ep) => ep.id === id);
}

export function getMicroserviceList(): MicroserviceInfo[] {
  // TODO: Replace with API call → GET /api/dashboard/health
  return [...mockMicroservices];
}

export function getMicroserviceInfoById(id: string): MicroserviceInfo | undefined {
  // TODO: Replace with API call → GET /api/health/info
  return mockMicroservices.find((s) => s.id === id);
}

export function getMonitoringAlerts(): MonitoringAlert[] {
  // TODO: Replace with API call → GET /api/dashboard/status (alerts section)
  return [...mockAlerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getActiveAlerts(): MonitoringAlert[] {
  return getMonitoringAlerts().filter((a) => a.status === 'active');
}

export function getAlertRules(): AlertRule[] {
  // TODO: Replace with API call (not yet in backend spec)
  return [...mockAlertRules];
}

export function getAlertRuleById(id: string): AlertRule | undefined {
  return mockAlertRules.find((r) => r.id === id);
}

export function getSystemHealthSummary(): SystemHealthSummary {
  // TODO: Replace with API call → GET /api/dashboard/status
  const latestPerf = getLatestPerformance();
  const latestRes = getLatestResource();

  const healthyApis = mockApiEndpoints.filter((a) => a.status === 'healthy').length;
  const degradedApis = mockApiEndpoints.filter((a) => a.status === 'degraded').length;
  const downApis = mockApiEndpoints.filter((a) => a.status === 'down').length;

  const healthyServices = mockMicroservices.filter((s) => s.status === 'healthy').length;
  const degradedServices = mockMicroservices.filter((s) => s.status === 'degraded').length;
  const downServices = mockMicroservices.filter((s) => s.status === 'down').length;

  const activeAlerts = mockAlerts.filter((a) => a.status === 'active').length;
  const criticalAlerts = mockAlerts.filter((a) => a.severity === 'critical' && a.status === 'active').length;

  // Calculate health score
  let score = 100;
  score -= downApis * 10;
  score -= degradedApis * 3;
  score -= downServices * 12;
  score -= degradedServices * 5;
  score -= criticalAlerts * 8;
  score -= activeAlerts * 2;
  if (latestPerf.cpuUsage > 80) score -= 5;
  if (latestPerf.memoryUsage > 80) score -= 5;
  if (latestPerf.errorRate > 2) score -= 5;

  const overallStatus: ServiceStatus =
    score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'down';

  return {
    overallStatus,
    healthScore: Math.max(0, Math.min(100, score)),
    uptimePercentage: 99.85,
    totalApis: mockApiEndpoints.length,
    healthyApis,
    degradedApis,
    downApis,
    totalServices: mockMicroservices.length,
    healthyServices,
    degradedServices,
    downServices,
    activeAlerts,
    criticalAlerts,
    avgResponseTime: latestPerf.avgResponseTime,
    currentCpu: latestPerf.cpuUsage,
    currentMemory: latestPerf.memoryUsage,
    currentDisk: latestRes.diskUsage,
    requestRate: latestPerf.requestRate,
    errorRate: latestPerf.errorRate,
  };
}

// ── Real-time simulation functions ───────────────────────────────
// These produce new data points for the timer to append

export function simulatePerformanceTick(): PerformanceSnapshot {
  const prev = performanceHistory[performanceHistory.length - 1];
  const next: PerformanceSnapshot = {
    timestamp: new Date().toISOString(),
    cpuUsage: drift(prev.cpuUsage, 5, 15, 92),
    memoryUsage: drift(prev.memoryUsage, 3, 40, 88),
    avgResponseTime: drift(prev.avgResponseTime, 20, 50, 800),
    requestRate: drift(prev.requestRate, 30, 100, 800),
    errorRate: clamp(drift(prev.errorRate, 0.5, 0, 12), 0, 15),
    activeConnections: Math.round(drift(prev.activeConnections, 50, 200, 2000)),
  };
  performanceHistory.push(next);
  // Keep only last 4 hours
  if (performanceHistory.length > 4 * 12 + 1) {
    performanceHistory = performanceHistory.slice(-4 * 12);
  }
  return next;
}

export function simulateResourceTick(): ResourceSnapshot {
  const prev = resourceHistory[resourceHistory.length - 1];
  const mem = drift(prev.memoryUsage, 2, 35, 90);
  const disk = drift(prev.diskUsage, 0.3, 30, 85);
  const next: ResourceSnapshot = {
    timestamp: new Date().toISOString(),
    cpuUsage: drift(prev.cpuUsage, 4, 10, 95),
    memoryUsage: mem,
    memoryUsedGB: parseFloat((mem * 0.32).toFixed(1)),
    memoryTotalGB: 32,
    diskUsage: disk,
    diskUsedGB: parseFloat((disk * 5).toFixed(1)),
    diskTotalGB: 500,
    networkInMbps: drift(prev.networkInMbps, 15, 30, 500),
    networkOutMbps: drift(prev.networkOutMbps, 10, 10, 300),
    dbConnections: Math.round(drift(prev.dbConnections, 5, 5, 95)),
    dbMaxConnections: 100,
    activeSessions: Math.round(drift(prev.activeSessions, 80, 200, 3000)),
  };
  resourceHistory.push(next);
  if (resourceHistory.length > 4 * 12 + 1) {
    resourceHistory = resourceHistory.slice(-4 * 12);
  }
  return next;
}

export function simulateApiEndpointTick(): ApiEndpointMetric[] {
  return mockApiEndpoints.map((ep) => {
    if (ep.status === 'down') return ep;
    ep.avgResponseTime = Math.round(drift(ep.avgResponseTime, ep.avgResponseTime * 0.15, 10, 2000));
    ep.p95ResponseTime = Math.round(ep.avgResponseTime * randFloat(1.8, 2.5));
    ep.p99ResponseTime = Math.round(ep.avgResponseTime * randFloat(2.5, 4.0));
    ep.lastChecked = new Date().toISOString();
    return ep;
  });
}

// ── Mutation helpers (mock) ──────────────────────────────────────

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  // TODO: Replace with API call
  const alert = mockAlerts.find((a) => a.id === alertId);
  if (alert && alert.status === 'active') {
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = 'admin@busmate.lk';
    return true;
  }
  return false;
}

export async function resolveAlert(alertId: string): Promise<boolean> {
  // TODO: Replace with API call
  const alert = mockAlerts.find((a) => a.id === alertId);
  if (alert && (alert.status === 'active' || alert.status === 'acknowledged')) {
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export async function toggleAlertRule(ruleId: string): Promise<boolean> {
  // TODO: Replace with API call
  const rule = mockAlertRules.find((r) => r.id === ruleId);
  if (rule) {
    rule.enabled = !rule.enabled;
    return true;
  }
  return false;
}

export async function restartMicroservice(serviceId: string): Promise<boolean> {
  // TODO: Replace with API call
  console.log(`[Mock] Restarting service ${serviceId}`);
  return true;
}

// ── Export mock data for direct access ────────────────────────────

export const systemMonitoringMockData = {
  apiEndpoints: mockApiEndpoints,
  microservices: mockMicroservices,
  alerts: mockAlerts,
  alertRules: mockAlertRules,
};
