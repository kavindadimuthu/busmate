// Admin portal type definitions
// These types define the data structures used throughout the admin portal

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalUsersChange: string;
  systemUptime: string;
  uptimeStatus: string;
  criticalAlerts: number;
  alertsStatus: string;
  totalBuses: number;
  busesChange: string;
  dailyTransactions: string;
  transactionsLabel: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'user' | 'system' | 'security' | 'transaction';
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

// User management types (DEPRECATED - use types from ./users.ts instead)
// Kept for backward compatibility only
/** @deprecated Use SystemUser from ./users instead */
export interface User {
  id: string;
  name: string;
  email: string;
  type: 'Passenger' | 'Conductor' | 'Fleet' | 'Time Keeper' | 'MOT';
  status: 'Active' | 'Suspended' | 'Pending' | 'Inactive';
  lastLogin: string;
  createdAt: string;
  phone?: string;
  avatar?: string;
}

/** @deprecated Use UserStatsData from ./users instead */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  passengerCount: number;
  conductorCount: number;
  fleetCount: number;
  timekeeperCount: number;
  motCount: number;
}

/** @deprecated Use UserFiltersState from ./users instead */
export interface UserFilter {
  search: string;
  type: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'critical' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'passengers' | 'conductors' | 'fleet_operators' | 'mot_officers' | 'timekeepers';
  status: 'sent' | 'scheduled' | 'draft' | 'failed';
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
  readCount: number;
  totalRecipients: number;
  senderId: string;
  senderName: string;
  channel?: 'push' | 'email' | 'sms' | 'in-app';
}

/** @deprecated Use NotificationStats from ./notifications instead */
export interface NotificationStats {
  totalSent: number;
  totalScheduled: number;
  totalDraft: number;
  averageReadRate: number;
}

// Monitoring types are now in ./system-monitoring.ts

// Log types
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userType: string;
  action: string;
  details: string;
  ipAddress: string;
  device: string;
  location: string;
  status: 'success' | 'error' | 'warning';
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'suspicious_activity';
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApplicationLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

// Analytics types
export interface AnalyticsMetric {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface Report {
  id: string;
  name: string;
  type: string;
  lastGenerated: string;
  status: 'completed' | 'processing' | 'failed';
  size: string;
  format: 'PDF' | 'Excel' | 'CSV';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// NOTE: Settings types (SystemSettings, BackupEntry, AdminProfile) have been moved to system-settings.ts
// The old settings.ts data file used these types but is now replaced by system-settings.ts
