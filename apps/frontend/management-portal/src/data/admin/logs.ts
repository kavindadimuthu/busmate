// System logs mock data for admin portal
// Replace these functions with API calls when backend is ready

import { UserActivityLog, SecurityLog, ApplicationLog } from './types';

// ──────────────────────────────────────────
// Mock User Activity Logs (extended dataset)
// ──────────────────────────────────────────
const mockUserActivityLogs: UserActivityLog[] = [
  {
    id: 'UAL-001',
    timestamp: '2026-02-21 14:32:45',
    userId: 'USR-12847',
    userName: 'John Doe',
    userType: 'Passenger',
    action: 'Login',
    details: 'Successful login via mobile app',
    ipAddress: '192.168.1.105',
    device: 'iPhone 14 Pro',
    location: 'Colombo, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-002',
    timestamp: '2026-02-21 14:30:12',
    userId: 'USR-98432',
    userName: 'Sarah Wilson',
    userType: 'Conductor',
    action: 'Route Update',
    details: 'Updated bus route BC-138 schedule',
    ipAddress: '10.0.1.23',
    device: 'Android Tablet',
    location: 'Kandy, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-003',
    timestamp: '2026-02-21 14:28:33',
    userId: 'USR-55621',
    userName: 'Mike Chen',
    userType: 'Passenger',
    action: 'Payment Failed',
    details: 'Credit card payment declined for ticket booking',
    ipAddress: '203.94.15.78',
    device: 'Chrome Browser',
    location: 'Galle, Sri Lanka',
    status: 'error',
  },
  {
    id: 'UAL-004',
    timestamp: '2026-02-21 14:25:17',
    userId: 'ADM-00123',
    userName: 'Admin User',
    userType: 'Administrator',
    action: 'User Management',
    details: 'Created new conductor account for route BC-301',
    ipAddress: '10.0.0.1',
    device: 'Windows PC',
    location: 'Colombo Office',
    status: 'success',
  },
  {
    id: 'UAL-005',
    timestamp: '2026-02-21 14:22:05',
    userId: 'USR-77394',
    userName: 'Emma Davis',
    userType: 'Passenger',
    action: 'Ticket Booking',
    details: 'Booked ticket for Route BC-245 from Colombo to Kandy',
    ipAddress: '172.16.0.45',
    device: 'Samsung Galaxy S24',
    location: 'Negombo, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-006',
    timestamp: '2026-02-21 14:20:18',
    userId: 'USR-34521',
    userName: 'David Brown',
    userType: 'Fleet Manager',
    action: 'Bus Assignment',
    details: 'Assigned bus LM-7832 to Route BC-301',
    ipAddress: '192.168.10.12',
    device: 'iPad Pro',
    location: 'Matara Depot',
    status: 'success',
  },
  {
    id: 'UAL-007',
    timestamp: '2026-02-21 14:18:45',
    userId: 'MOT-00012',
    userName: 'Ruwan Silva',
    userType: 'MOT Officer',
    action: 'Route Approval',
    details: 'Approved new route BC-412 from Galle to Matara',
    ipAddress: '10.0.0.15',
    device: 'Windows PC',
    location: 'MOT Office',
    status: 'success',
  },
  {
    id: 'UAL-008',
    timestamp: '2026-02-21 14:15:30',
    userId: 'USR-88234',
    userName: 'Priya Sharma',
    userType: 'Timekeeper',
    action: 'Bus Check-in',
    details: 'Checked in bus NB-4521 at Fort Terminal',
    ipAddress: '192.168.5.78',
    device: 'Android Phone',
    location: 'Colombo Fort',
    status: 'success',
  },
  {
    id: 'UAL-009',
    timestamp: '2026-02-21 13:55:10',
    userId: 'USR-44892',
    userName: 'Nimal Perera',
    userType: 'Passenger',
    action: 'Profile Update',
    details: 'Updated phone number and email address in profile',
    ipAddress: '192.168.2.200',
    device: 'Chrome Browser',
    location: 'Colombo, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-010',
    timestamp: '2026-02-21 13:48:22',
    userId: 'USR-55621',
    userName: 'Mike Chen',
    userType: 'Passenger',
    action: 'Ticket Cancellation',
    details: 'Cancelled ticket #TK-89012 for Route BC-138',
    ipAddress: '203.94.15.78',
    device: 'Chrome Browser',
    location: 'Galle, Sri Lanka',
    status: 'warning',
  },
  {
    id: 'UAL-011',
    timestamp: '2026-02-21 13:42:55',
    userId: 'ADM-00123',
    userName: 'Admin User',
    userType: 'Administrator',
    action: 'System Settings',
    details: 'Modified push notification settings for all users',
    ipAddress: '10.0.0.1',
    device: 'Windows PC',
    location: 'Colombo Office',
    status: 'success',
  },
  {
    id: 'UAL-012',
    timestamp: '2026-02-21 13:35:08',
    userId: 'USR-67890',
    userName: 'Amara Fernando',
    userType: 'Conductor',
    action: 'Trip Start',
    details: 'Started trip #TP-5523 on Route BC-245',
    ipAddress: '192.168.8.45',
    device: 'Android Phone',
    location: 'Kandy, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-013',
    timestamp: '2026-02-21 13:28:33',
    userId: 'USR-34521',
    userName: 'David Brown',
    userType: 'Fleet Manager',
    action: 'Bus Maintenance',
    details: 'Scheduled maintenance for bus LM-4521 at Colombo Depot',
    ipAddress: '192.168.10.12',
    device: 'iPad Pro',
    location: 'Colombo Depot',
    status: 'success',
  },
  {
    id: 'UAL-014',
    timestamp: '2026-02-21 13:15:45',
    userId: 'USR-11234',
    userName: 'Kasun Jayawardena',
    userType: 'Passenger',
    action: 'Login',
    details: 'Failed login attempt - account locked after 5 attempts',
    ipAddress: '45.123.67.89',
    device: 'Firefox Browser',
    location: 'Colombo, Sri Lanka',
    status: 'error',
  },
  {
    id: 'UAL-015',
    timestamp: '2026-02-21 13:08:20',
    userId: 'MOT-00015',
    userName: 'Lakshmi Gunawardena',
    userType: 'MOT Officer',
    action: 'Permit Issuance',
    details: 'Issued permit PSP-2026-0045 to Lanka Express for Route BC-412',
    ipAddress: '10.0.0.20',
    device: 'Windows PC',
    location: 'MOT Office',
    status: 'success',
  },
  {
    id: 'UAL-016',
    timestamp: '2026-02-21 12:55:10',
    userId: 'USR-99001',
    userName: 'Thilini Perera',
    userType: 'Passenger',
    action: 'Feedback',
    details: 'Submitted feedback for trip #TP-5510 - positive review',
    ipAddress: '192.168.1.88',
    device: 'iPhone 15',
    location: 'Negombo, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-017',
    timestamp: '2026-02-21 12:42:18',
    userId: 'USR-34521',
    userName: 'David Brown',
    userType: 'Fleet Manager',
    action: 'Fleet Report',
    details: 'Downloaded fleet performance report for January 2026',
    ipAddress: '192.168.10.12',
    device: 'Windows PC',
    location: 'Colombo Office',
    status: 'success',
  },
  {
    id: 'UAL-018',
    timestamp: '2026-02-21 12:30:05',
    userId: 'USR-88234',
    userName: 'Priya Sharma',
    userType: 'Timekeeper',
    action: 'Attendance Record',
    details: 'Recorded late arrival for conductor USR-67890 at Fort Terminal',
    ipAddress: '192.168.5.78',
    device: 'Android Phone',
    location: 'Colombo Fort',
    status: 'warning',
  },
  {
    id: 'UAL-019',
    timestamp: '2026-02-21 12:15:45',
    userId: 'USR-22345',
    userName: 'Sanjay Kumar',
    userType: 'Passenger',
    action: 'Payment',
    details: 'Completed payment of LKR 450 for Route BC-301 ticket',
    ipAddress: '172.16.0.100',
    device: 'Samsung Galaxy A54',
    location: 'Jaffna, Sri Lanka',
    status: 'success',
  },
  {
    id: 'UAL-020',
    timestamp: '2026-02-21 12:05:30',
    userId: 'ADM-00123',
    userName: 'Admin User',
    userType: 'Administrator',
    action: 'User Suspension',
    details: 'Suspended user USR-11234 due to multiple failed login attempts',
    ipAddress: '10.0.0.1',
    device: 'Windows PC',
    location: 'Colombo Office',
    status: 'warning',
  },
];

// ──────────────────────────────────────────
// Mock Security Logs (extended dataset)
// ──────────────────────────────────────────
const mockSecurityLogs: SecurityLog[] = [
  {
    id: 'SEC-001',
    timestamp: '2026-02-21 14:45:12',
    eventType: 'login',
    userId: 'ADM-001',
    userName: 'System Admin',
    ipAddress: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    details: 'Successful admin login from trusted network',
    severity: 'low',
  },
  {
    id: 'SEC-002',
    timestamp: '2026-02-21 14:40:33',
    eventType: 'failed_login',
    userId: 'USR-12345',
    userName: 'Unknown',
    ipAddress: '192.168.100.50',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    details: 'Failed login attempt - invalid password (3rd attempt)',
    severity: 'medium',
  },
  {
    id: 'SEC-003',
    timestamp: '2026-02-21 14:35:18',
    eventType: 'suspicious_activity',
    ipAddress: '45.33.32.156',
    userAgent: 'curl/7.81.0',
    details: 'Multiple rapid API requests detected - possible DDoS attempt from external IP',
    severity: 'high',
  },
  {
    id: 'SEC-004',
    timestamp: '2026-02-21 14:30:45',
    eventType: 'permission_change',
    userId: 'MOT-002',
    userName: 'Kamal Perera',
    ipAddress: '10.0.0.5',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/123.0',
    details: 'User granted route_management permission by ADM-001',
    severity: 'medium',
  },
  {
    id: 'SEC-005',
    timestamp: '2026-02-21 14:25:00',
    eventType: 'password_change',
    userId: 'USR-55621',
    userName: 'Mike Chen',
    ipAddress: '203.94.15.78',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    details: 'Password changed successfully after security notification',
    severity: 'low',
  },
  {
    id: 'SEC-006',
    timestamp: '2026-02-21 14:20:15',
    eventType: 'suspicious_activity',
    ipAddress: '185.220.101.45',
    userAgent: 'python-requests/2.28.1',
    details: 'Brute force attack detected - IP blocked automatically by firewall',
    severity: 'critical',
  },
  {
    id: 'SEC-007',
    timestamp: '2026-02-21 14:15:30',
    eventType: 'logout',
    userId: 'FLT-023',
    userName: 'Lanka Express',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Safari/17.4',
    details: 'User logged out normally',
    severity: 'low',
  },
  {
    id: 'SEC-008',
    timestamp: '2026-02-21 13:58:22',
    eventType: 'failed_login',
    userId: 'USR-11234',
    userName: 'Kasun Jayawardena',
    ipAddress: '45.123.67.89',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/123.0',
    details: 'Account locked after 5 consecutive failed login attempts',
    severity: 'high',
  },
  {
    id: 'SEC-009',
    timestamp: '2026-02-21 13:45:10',
    eventType: 'suspicious_activity',
    ipAddress: '103.45.67.89',
    userAgent: 'Scrapy/2.11',
    details: 'Web scraping attempt detected on route schedules API endpoint',
    severity: 'medium',
  },
  {
    id: 'SEC-010',
    timestamp: '2026-02-21 13:30:55',
    eventType: 'permission_change',
    userId: 'ADM-00123',
    userName: 'Admin User',
    ipAddress: '10.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    details: 'Elevated privileges granted to user MOT-00015 for permit management',
    severity: 'medium',
  },
  {
    id: 'SEC-011',
    timestamp: '2026-02-21 13:22:18',
    eventType: 'login',
    userId: 'MOT-00015',
    userName: 'Lakshmi Gunawardena',
    ipAddress: '10.0.0.20',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    details: 'Successful login with 2FA verification from MOT office',
    severity: 'low',
  },
  {
    id: 'SEC-012',
    timestamp: '2026-02-21 13:10:05',
    eventType: 'suspicious_activity',
    ipAddress: '198.51.100.42',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
    details: 'SQL injection attempt detected in search query parameter',
    severity: 'critical',
  },
  {
    id: 'SEC-013',
    timestamp: '2026-02-21 12:55:33',
    eventType: 'password_change',
    userId: 'USR-98432',
    userName: 'Sarah Wilson',
    ipAddress: '10.0.1.23',
    userAgent: 'BusMate Mobile App v2.5.1 (Android)',
    details: 'Password reset via email verification link',
    severity: 'low',
  },
  {
    id: 'SEC-014',
    timestamp: '2026-02-21 12:40:45',
    eventType: 'failed_login',
    ipAddress: '172.16.254.100',
    userAgent: 'PostmanRuntime/7.36.0',
    details: 'Failed API authentication with expired token from development environment',
    severity: 'medium',
  },
  {
    id: 'SEC-015',
    timestamp: '2026-02-21 12:28:10',
    eventType: 'login',
    userId: 'USR-34521',
    userName: 'David Brown',
    ipAddress: '192.168.10.12',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) Safari/17.4',
    details: 'Successful login from known device at Matara Depot',
    severity: 'low',
  },
];

// ──────────────────────────────────────────
// Mock Application Logs (extended dataset)
// ──────────────────────────────────────────
const mockApplicationLogs: ApplicationLog[] = [
  {
    id: 'APP-001',
    timestamp: '2026-02-21 14:32:15',
    level: 'ERROR',
    service: 'Payment Service',
    message: 'Payment gateway timeout while processing transaction TXN-89012',
    stackTrace: 'PaymentGatewayException: Connection timeout after 30s\n  at PaymentService.processPayment(PaymentService.java:142)\n  at PaymentController.handlePayment(PaymentController.java:89)\n  at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)',
    metadata: { transactionId: 'TXN-89012', userId: 'USR-12847', amount: 1500 },
  },
  {
    id: 'APP-002',
    timestamp: '2026-02-21 14:31:58',
    level: 'WARN',
    service: 'Server Monitor',
    message: 'High server load detected - CPU utilization at 85%',
    metadata: { cpu: 85, memory: 72, disk: 45 },
  },
  {
    id: 'APP-003',
    timestamp: '2026-02-21 14:31:42',
    level: 'INFO',
    service: 'Auth Service',
    message: 'User login successful from IP 192.168.1.100',
    metadata: { userId: 'ADM-001', sessionId: 'sess-abc123' },
  },
  {
    id: 'APP-004',
    timestamp: '2026-02-21 14:31:25',
    level: 'INFO',
    service: 'Booking Service',
    message: 'Booking BK-2026-5847 created successfully for Route BC-245',
    metadata: { bookingId: 'BK-2026-5847', routeId: 'BC-245', userId: 'USR-77394' },
  },
  {
    id: 'APP-005',
    timestamp: '2026-02-21 14:31:08',
    level: 'ERROR',
    service: 'Database Service',
    message: 'Database connection pool exhausted - retry attempt 2/3',
    stackTrace: 'SQLException: Connection pool limit reached (max: 50)\n  at HikariPool.getConnection(HikariPool.java:128)\n  at DataSourceProxy.getConnection(DataSourceProxy.java:85)\n  at QueryExecutor.execute(QueryExecutor.java:42)',
    metadata: { poolSize: 50, activeConnections: 50, waitingThreads: 12 },
  },
  {
    id: 'APP-006',
    timestamp: '2026-02-21 14:30:55',
    level: 'INFO',
    service: 'Route Service',
    message: 'Route data synchronized from external transit authority feed',
    metadata: { routesUpdated: 15, newRoutes: 2 },
  },
  {
    id: 'APP-007',
    timestamp: '2026-02-21 14:30:30',
    level: 'DEBUG',
    service: 'Cache Service',
    message: 'Cache invalidated for route schedules - 245 entries cleared',
    metadata: { cacheKeys: 245, ttl: 3600 },
  },
  {
    id: 'APP-008',
    timestamp: '2026-02-21 14:30:15',
    level: 'WARN',
    service: 'Notification Service',
    message: 'Push notification delivery delayed for 150 users due to FCM throttling',
    metadata: { affectedUsers: 150, retryAfter: 60 },
  },
  {
    id: 'APP-009',
    timestamp: '2026-02-21 14:28:45',
    level: 'ERROR',
    service: 'Location Tracking',
    message: 'GPS data gap detected for bus NB-4521 lasting 8 minutes',
    stackTrace: 'GPSDataException: No data received for 480 seconds\n  at LocationTracker.checkHeartbeat(LocationTracker.java:201)\n  at ScheduledHealthCheck.run(ScheduledHealthCheck.java:45)',
    metadata: { busId: 'NB-4521', lastSignal: '2026-02-21 14:20:45', gap: 480 },
  },
  {
    id: 'APP-010',
    timestamp: '2026-02-21 14:25:30',
    level: 'INFO',
    service: 'Auth Service',
    message: 'Batch token refresh completed for 342 active sessions',
    metadata: { refreshed: 342, failed: 0 },
  },
  {
    id: 'APP-011',
    timestamp: '2026-02-21 14:22:18',
    level: 'WARN',
    service: 'Payment Service',
    message: 'Payment reconciliation mismatch detected - LKR 2,500 discrepancy',
    metadata: { expected: 125000, actual: 122500, currency: 'LKR' },
  },
  {
    id: 'APP-012',
    timestamp: '2026-02-21 14:18:55',
    level: 'INFO',
    service: 'Booking Service',
    message: 'Daily booking summary generated - 1,247 bookings processed',
    metadata: { totalBookings: 1247, revenue: 562150, currency: 'LKR' },
  },
  {
    id: 'APP-013',
    timestamp: '2026-02-21 14:15:10',
    level: 'ERROR',
    service: 'Notification Service',
    message: 'SMS gateway returned error: Insufficient credits for bulk notification',
    stackTrace: 'SMSGatewayException: HTTP 402 Payment Required\n  at SMSService.sendBulk(SMSService.java:156)\n  at NotificationWorker.process(NotificationWorker.java:78)',
    metadata: { pendingMessages: 500, credits: 12 },
  },
  {
    id: 'APP-014',
    timestamp: '2026-02-21 14:10:42',
    level: 'DEBUG',
    service: 'Route Service',
    message: 'Route optimization completed for BC-138 in 2.3 seconds',
    metadata: { routeId: 'BC-138', optimizationTime: 2300, stops: 24 },
  },
  {
    id: 'APP-015',
    timestamp: '2026-02-21 14:05:20',
    level: 'INFO',
    service: 'Server Monitor',
    message: 'Automated health check passed - all 8 microservices healthy',
    metadata: { services: 8, healthy: 8, degraded: 0, down: 0 },
  },
  {
    id: 'APP-016',
    timestamp: '2026-02-21 14:00:00',
    level: 'WARN',
    service: 'Database Service',
    message: 'Slow query detected - execution time exceeded 5s threshold',
    metadata: { queryTime: 8500, table: 'trip_assignments', operation: 'SELECT' },
  },
  {
    id: 'APP-017',
    timestamp: '2026-02-21 13:55:35',
    level: 'INFO',
    service: 'Location Tracking',
    message: 'Real-time tracking active for 127 buses across all routes',
    metadata: { activeBuses: 127, totalRoutes: 45 },
  },
  {
    id: 'APP-018',
    timestamp: '2026-02-21 13:50:15',
    level: 'ERROR',
    service: 'Auth Service',
    message: 'OAuth2 token validation failed for external integration partner',
    stackTrace: 'TokenValidationException: Token signature mismatch\n  at JWTValidator.validate(JWTValidator.java:88)\n  at AuthFilter.doFilter(AuthFilter.java:56)',
    metadata: { partner: 'TransitPartner', tokenAge: 7200 },
  },
];

// ──────────────────────────────────────────
// Statistics & Analytics
// ──────────────────────────────────────────

export interface LogStats {
  // Overview metrics
  totalLogs: number;
  totalUserActivities: number;
  totalSecurityEvents: number;
  totalApplicationLogs: number;
  // User activity breakdown
  successfulActions: number;
  failedActions: number;
  warningActions: number;
  uniqueUsers: number;
  // Application log breakdown
  errorLogs: number;
  warningLogs: number;
  infoLogs: number;
  debugLogs: number;
  uniqueServices: number;
  // Security breakdown
  criticalSecurityEvents: number;
  highSecurityEvents: number;
  mediumSecurityEvents: number;
  lowSecurityEvents: number;
  blockedThreats: number;
  // Trends (last 7 days)
  dailyLogCounts: { date: string; userActivity: number; security: number; application: number }[];
  // Top items
  topActions: { action: string; count: number }[];
  topServices: { service: string; errorCount: number; totalCount: number }[];
}

function calculateLogStats(): LogStats {
  const userActivityCount = mockUserActivityLogs.length;
  const securityCount = mockSecurityLogs.length;
  const applicationCount = mockApplicationLogs.length;

  const successfulActions = mockUserActivityLogs.filter(l => l.status === 'success').length;
  const failedActions = mockUserActivityLogs.filter(l => l.status === 'error').length;
  const warningActions = mockUserActivityLogs.filter(l => l.status === 'warning').length;
  const uniqueUsers = new Set(mockUserActivityLogs.map(l => l.userId)).size;

  const errorLogs = mockApplicationLogs.filter(l => l.level === 'ERROR').length;
  const warningLogs = mockApplicationLogs.filter(l => l.level === 'WARN').length;
  const infoLogs = mockApplicationLogs.filter(l => l.level === 'INFO').length;
  const debugLogs = mockApplicationLogs.filter(l => l.level === 'DEBUG').length;
  const uniqueServices = new Set(mockApplicationLogs.map(l => l.service)).size;

  const criticalSecurityEvents = mockSecurityLogs.filter(l => l.severity === 'critical').length;
  const highSecurityEvents = mockSecurityLogs.filter(l => l.severity === 'high').length;
  const mediumSecurityEvents = mockSecurityLogs.filter(l => l.severity === 'medium').length;
  const lowSecurityEvents = mockSecurityLogs.filter(l => l.severity === 'low').length;
  const blockedThreats = mockSecurityLogs.filter(l =>
    l.severity === 'critical' || l.severity === 'high'
  ).length;

  const dailyLogCounts = [
    { date: '2026-02-15', userActivity: 145, security: 22, application: 312 },
    { date: '2026-02-16', userActivity: 132, security: 18, application: 289 },
    { date: '2026-02-17', userActivity: 98, security: 15, application: 245 },
    { date: '2026-02-18', userActivity: 167, security: 31, application: 356 },
    { date: '2026-02-19', userActivity: 155, security: 25, application: 334 },
    { date: '2026-02-20', userActivity: 178, security: 28, application: 367 },
    { date: '2026-02-21', userActivity: 20, security: 15, application: 18 },
  ];

  const actionCounts: Record<string, number> = {};
  mockUserActivityLogs.forEach(l => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const serviceCounts: Record<string, { errorCount: number; totalCount: number }> = {};
  mockApplicationLogs.forEach(l => {
    if (!serviceCounts[l.service]) {
      serviceCounts[l.service] = { errorCount: 0, totalCount: 0 };
    }
    serviceCounts[l.service].totalCount++;
    if (l.level === 'ERROR') serviceCounts[l.service].errorCount++;
  });
  const topServices = Object.entries(serviceCounts)
    .map(([service, counts]) => ({ service, ...counts }))
    .sort((a, b) => b.errorCount - a.errorCount);

  return {
    totalLogs: userActivityCount + securityCount + applicationCount,
    totalUserActivities: userActivityCount,
    totalSecurityEvents: securityCount,
    totalApplicationLogs: applicationCount,
    successfulActions,
    failedActions,
    warningActions,
    uniqueUsers,
    errorLogs,
    warningLogs,
    infoLogs,
    debugLogs,
    uniqueServices,
    criticalSecurityEvents,
    highSecurityEvents,
    mediumSecurityEvents,
    lowSecurityEvents,
    blockedThreats,
    dailyLogCounts,
    topActions,
    topServices,
  };
}

// ──────────────────────────────────────────
// API functions (to be replaced with real API calls)
// ──────────────────────────────────────────

export function getUserActivityLogs(limit?: number): UserActivityLog[] {
  return limit ? mockUserActivityLogs.slice(0, limit) : [...mockUserActivityLogs];
}

export function getSecurityLogs(limit?: number): SecurityLog[] {
  return limit ? mockSecurityLogs.slice(0, limit) : [...mockSecurityLogs];
}

export function getApplicationLogs(limit?: number): ApplicationLog[] {
  return limit ? mockApplicationLogs.slice(0, limit) : [...mockApplicationLogs];
}

export function getLogById(id: string): UserActivityLog | SecurityLog | ApplicationLog | null {
  const userActivity = mockUserActivityLogs.find(l => l.id === id);
  if (userActivity) return userActivity;
  const security = mockSecurityLogs.find(l => l.id === id);
  if (security) return security;
  const application = mockApplicationLogs.find(l => l.id === id);
  if (application) return application;
  return null;
}

export function getLogType(id: string): 'user-activity' | 'security' | 'application' | null {
  if (mockUserActivityLogs.find(l => l.id === id)) return 'user-activity';
  if (mockSecurityLogs.find(l => l.id === id)) return 'security';
  if (mockApplicationLogs.find(l => l.id === id)) return 'application';
  return null;
}

export function getLogStats(): LogStats {
  return calculateLogStats();
}

export function filterUserActivityLogs(filters: {
  userType?: string;
  action?: string;
  status?: string;
  search?: string;
}): UserActivityLog[] {
  let filtered = [...mockUserActivityLogs];

  if (filters.userType && filters.userType !== 'all') {
    filtered = filtered.filter(l => l.userType === filters.userType);
  }
  if (filters.action && filters.action !== 'all') {
    filtered = filtered.filter(l => l.action === filters.action);
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(l => l.status === filters.status);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(l =>
      l.userName.toLowerCase().includes(search) ||
      l.details.toLowerCase().includes(search) ||
      l.userId.toLowerCase().includes(search) ||
      l.action.toLowerCase().includes(search) ||
      l.location.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export function filterSecurityLogs(filters: {
  eventType?: string;
  severity?: string;
  search?: string;
}): SecurityLog[] {
  let filtered = [...mockSecurityLogs];

  if (filters.eventType && filters.eventType !== 'all') {
    filtered = filtered.filter(l => l.eventType === filters.eventType);
  }
  if (filters.severity && filters.severity !== 'all') {
    filtered = filtered.filter(l => l.severity === filters.severity);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(l =>
      l.details.toLowerCase().includes(search) ||
      (l.userName?.toLowerCase().includes(search)) ||
      l.ipAddress.toLowerCase().includes(search) ||
      l.eventType.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export function filterApplicationLogs(filters: {
  level?: string;
  service?: string;
  search?: string;
}): ApplicationLog[] {
  let filtered = [...mockApplicationLogs];

  if (filters.level && filters.level !== 'all') {
    filtered = filtered.filter(l => l.level === filters.level);
  }
  if (filters.service && filters.service !== 'all') {
    filtered = filtered.filter(l => l.service === filters.service);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(l =>
      l.message.toLowerCase().includes(search) ||
      l.service.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export function getUniqueServices(): string[] {
  return [...new Set(mockApplicationLogs.map(l => l.service))].sort();
}

export function getUniqueUserTypes(): string[] {
  return [...new Set(mockUserActivityLogs.map(l => l.userType))].sort();
}

export function getUniqueActions(): string[] {
  return [...new Set(mockUserActivityLogs.map(l => l.action))].sort();
}

export async function exportLogs(
  type: 'user-activity' | 'security' | 'application',
  format: 'csv' | 'json'
): Promise<string> {
  // TODO: Replace with API call
  console.log(`Exporting ${type} logs as ${format}`);
  return 'export_link_placeholder';
}

export const mockData = {
  userActivityLogs: mockUserActivityLogs,
  securityLogs: mockSecurityLogs,
  applicationLogs: mockApplicationLogs,
};
