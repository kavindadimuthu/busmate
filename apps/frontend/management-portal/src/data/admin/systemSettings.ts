// ── System Settings Data Layer ────────────────────────────────────
// Provides types, mock data, and API-like functions for the
// System Settings admin section.
// When the backend is ready, replace function bodies with real API calls.

// ── Types ────────────────────────────────────────────────────────

export interface GeneralSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  address: string;
  timeZone: string;
  dateFormat: string;
  language: string;
  currency: string;
  sessionTimeout: number; // minutes
  passwordExpiry: number; // days
  twoFactorEnabled: boolean;
  lockAfterFailedAttempts: boolean;
  maxLoginAttempts: number;
  emailNotifications: boolean;
  smsAlerts: boolean;
}

export interface ApiSettings {
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  apiTimeout: number; // seconds
  maxPayloadSize: number; // MB
  apiLoggingEnabled: boolean;
  corsEnabled: boolean;
  corsAllowedOrigins: string[];
  responseCompression: boolean;
  aggressiveCaching: boolean;
  cacheExpiryMinutes: number;
  maxDatabaseConnections: number;
  webhookUrl: string;
  webhookEnabled: boolean;
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  status: 'active' | 'revoked' | 'expired';
  permissions: string[];
  expiresAt: string | null;
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  allowAdminAccess: boolean;
  scheduledMaintenanceStart: string | null;
  scheduledMaintenanceEnd: string | null;
  autoMaintenanceEnabled: boolean;
  maintenanceFrequency: 'daily' | 'weekly' | 'monthly';
  maintenanceWindowStart: string; // HH:mm
  maintenanceWindowEnd: string;   // HH:mm
  notifyUsersBeforeMaintenance: boolean;
  notifyMinutesBefore: number;
}

export interface MaintenanceHistoryEntry {
  id: string;
  task: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'completed' | 'failed' | 'warning' | 'in-progress';
  details: string;
  performedBy: string;
}

export interface SystemStatus {
  health: 'operational' | 'degraded' | 'down';
  activeSessions: number;
  uptime: string;
  uptimePercentage: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  lastRestart: string;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  backupTime: string; // HH:mm
  retentionDays: number;
  encryptBackups: boolean;
  storageLocation: 'local' | 'aws-s3' | 'google-cloud' | 'azure-blob';
  maxStorageGB: number;
  includeDatabase: boolean;
  includeFiles: boolean;
  includeConfigs: boolean;
  notifyOnComplete: boolean;
  notifyOnFailure: boolean;
}

export interface BackupEntry {
  id: string;
  type: 'Full System' | 'Database' | 'Configuration' | 'Files Only';
  date: string;
  size: string;
  status: 'completed' | 'failed' | 'in-progress';
  duration: string;
  location: string;
  encryptionEnabled: boolean;
}

export interface BackupStats {
  lastBackupTime: string;
  lastBackupSize: string;
  totalStorageUsed: string;
  maxStorage: string;
  retentionDays: number;
  totalBackups: number;
  successRate: number;
}

// ── Default / Mock Data ──────────────────────────────────────────

const defaultGeneralSettings: GeneralSettings = {
  siteName: 'BUSMATE LK',
  siteTagline: 'Sri Lanka\'s Digital Bus Transit Platform',
  logoUrl: '/images/logo/busmate-icon.png',
  faviconUrl: '/favicon.ico',
  contactEmail: 'info@busmate.lk',
  contactPhone: '+94 11 234 5678',
  supportEmail: 'support@busmate.lk',
  address: '42 Galle Road, Colombo 03, Sri Lanka',
  timeZone: 'Asia/Colombo',
  dateFormat: 'YYYY-MM-DD',
  language: 'en',
  currency: 'LKR',
  sessionTimeout: 60,
  passwordExpiry: 90,
  twoFactorEnabled: true,
  lockAfterFailedAttempts: true,
  maxLoginAttempts: 5,
  emailNotifications: true,
  smsAlerts: false,
};

const defaultApiSettings: ApiSettings = {
  rateLimitPerMinute: 60,
  rateLimitPerHour: 1000,
  apiTimeout: 30,
  maxPayloadSize: 10,
  apiLoggingEnabled: true,
  corsEnabled: true,
  corsAllowedOrigins: ['https://busmate.lk', 'https://admin.busmate.lk', 'http://localhost:3000'],
  responseCompression: true,
  aggressiveCaching: false,
  cacheExpiryMinutes: 15,
  maxDatabaseConnections: 100,
  webhookUrl: 'https://hooks.busmate.lk/events',
  webhookEnabled: true,
  apiKeys: [
    {
      id: 'KEY-001',
      name: 'Mobile App Production',
      key: 'bm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: '2025-06-15T09:00:00Z',
      lastUsed: '2026-02-21T08:30:00Z',
      status: 'active',
      permissions: ['read:routes', 'read:schedules', 'read:stops', 'write:tickets'],
      expiresAt: '2027-06-15T09:00:00Z',
    },
    {
      id: 'KEY-002',
      name: 'Web Dashboard',
      key: 'bm_live_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      createdAt: '2025-08-01T10:00:00Z',
      lastUsed: '2026-02-20T14:15:00Z',
      status: 'active',
      permissions: ['read:all', 'write:all'],
      expiresAt: '2027-08-01T10:00:00Z',
    },
    {
      id: 'KEY-003',
      name: 'Third-Party Analytics',
      key: 'bm_live_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      createdAt: '2025-04-10T11:00:00Z',
      lastUsed: '2025-12-01T16:00:00Z',
      status: 'revoked',
      permissions: ['read:analytics'],
      expiresAt: null,
    },
    {
      id: 'KEY-004',
      name: 'Ticketing Integration',
      key: 'bm_test_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      createdAt: '2025-11-20T08:00:00Z',
      lastUsed: null,
      status: 'expired',
      permissions: ['read:tickets', 'write:tickets'],
      expiresAt: '2026-01-20T08:00:00Z',
    },
  ],
};

const defaultMaintenanceSettings: MaintenanceSettings = {
  maintenanceMode: false,
  maintenanceTitle: 'System Maintenance',
  maintenanceMessage: 'We are performing scheduled maintenance. The system will be back online shortly.',
  allowAdminAccess: true,
  scheduledMaintenanceStart: null,
  scheduledMaintenanceEnd: null,
  autoMaintenanceEnabled: true,
  maintenanceFrequency: 'weekly',
  maintenanceWindowStart: '02:00',
  maintenanceWindowEnd: '04:00',
  notifyUsersBeforeMaintenance: true,
  notifyMinutesBefore: 30,
};

const mockMaintenanceHistory: MaintenanceHistoryEntry[] = [
  {
    id: 'MNT-001',
    task: 'Database Optimization',
    startTime: '2026-02-20T02:15:00Z',
    endTime: '2026-02-20T02:27:00Z',
    duration: '12 min',
    status: 'completed',
    details: 'Optimized 15 tables, reclaimed 2.3 GB disk space',
    performedBy: 'System (Auto)',
  },
  {
    id: 'MNT-002',
    task: 'System Cache Clear',
    startTime: '2026-02-19T02:00:00Z',
    endTime: '2026-02-19T02:03:00Z',
    duration: '3 min',
    status: 'completed',
    details: 'Cleared 890 MB cache data across all services',
    performedBy: 'System (Auto)',
  },
  {
    id: 'MNT-003',
    task: 'Security Scan',
    startTime: '2026-02-18T03:30:00Z',
    endTime: '2026-02-18T03:55:00Z',
    duration: '25 min',
    status: 'warning',
    details: '2 minor vulnerabilities found in dependencies',
    performedBy: 'Admin User',
  },
  {
    id: 'MNT-004',
    task: 'Service Restart – Route Management',
    startTime: '2026-02-17T04:00:00Z',
    endTime: '2026-02-17T04:02:00Z',
    duration: '2 min',
    status: 'completed',
    details: 'Route management microservice restarted successfully',
    performedBy: 'Admin User',
  },
  {
    id: 'MNT-005',
    task: 'SSL Certificate Renewal',
    startTime: '2026-02-15T01:00:00Z',
    endTime: '2026-02-15T01:00:00Z',
    duration: '0 min',
    status: 'failed',
    details: 'Certificate renewal failed – manual intervention required',
    performedBy: 'System (Auto)',
  },
];

const mockSystemStatus: SystemStatus = {
  health: 'operational',
  activeSessions: 342,
  uptime: '45d 12h 35m',
  uptimePercentage: 99.9,
  cpuUsage: 32,
  memoryUsage: 58,
  diskUsage: 45,
  lastRestart: '2026-01-07T03:00:00Z',
};

const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  retentionDays: 30,
  encryptBackups: true,
  storageLocation: 'aws-s3',
  maxStorageGB: 100,
  includeDatabase: true,
  includeFiles: true,
  includeConfigs: true,
  notifyOnComplete: false,
  notifyOnFailure: true,
};

const mockBackupHistory: BackupEntry[] = [
  {
    id: 'BKP-001',
    type: 'Full System',
    date: '2026-02-21T02:00:00Z',
    size: '2.4 GB',
    status: 'completed',
    duration: '45 min',
    location: 'AWS S3',
    encryptionEnabled: true,
  },
  {
    id: 'BKP-002',
    type: 'Database',
    date: '2026-02-20T02:00:00Z',
    size: '890 MB',
    status: 'completed',
    duration: '12 min',
    location: 'AWS S3',
    encryptionEnabled: true,
  },
  {
    id: 'BKP-003',
    type: 'Configuration',
    date: '2026-02-19T02:00:00Z',
    size: '45 MB',
    status: 'failed',
    duration: '0 min',
    location: 'AWS S3',
    encryptionEnabled: true,
  },
  {
    id: 'BKP-004',
    type: 'Full System',
    date: '2026-02-18T02:00:00Z',
    size: '2.3 GB',
    status: 'completed',
    duration: '42 min',
    location: 'AWS S3',
    encryptionEnabled: true,
  },
  {
    id: 'BKP-005',
    type: 'Database',
    date: '2026-02-17T02:00:00Z',
    size: '875 MB',
    status: 'completed',
    duration: '11 min',
    location: 'Local Storage',
    encryptionEnabled: false,
  },
  {
    id: 'BKP-006',
    type: 'Files Only',
    date: '2026-02-16T02:00:00Z',
    size: '1.1 GB',
    status: 'completed',
    duration: '18 min',
    location: 'AWS S3',
    encryptionEnabled: true,
  },
];

const mockBackupStats: BackupStats = {
  lastBackupTime: '2 hours ago',
  lastBackupSize: '2.4 GB',
  totalStorageUsed: '45.2 GB',
  maxStorage: '100 GB',
  retentionDays: 30,
  totalBackups: 124,
  successRate: 97.6,
};

// ── API Functions ────────────────────────────────────────────────
// Replace these with real API calls when backend is available.

// -- General Settings --

export function getGeneralSettings(): GeneralSettings {
  // TODO: return await api.get('/admin/settings/general');
  return { ...defaultGeneralSettings };
}

export async function updateGeneralSettings(
  settings: Partial<GeneralSettings>,
): Promise<GeneralSettings> {
  // TODO: return await api.patch('/admin/settings/general', settings);
  console.log('[mock] updateGeneralSettings', settings);
  return { ...defaultGeneralSettings, ...settings };
}

// -- API Settings --

export function getApiSettings(): ApiSettings {
  // TODO: return await api.get('/admin/settings/api');
  return { ...defaultApiSettings, apiKeys: defaultApiSettings.apiKeys.map((k) => ({ ...k })) };
}

export async function updateApiSettings(
  settings: Partial<Omit<ApiSettings, 'apiKeys'>>,
): Promise<ApiSettings> {
  // TODO: return await api.patch('/admin/settings/api', settings);
  console.log('[mock] updateApiSettings', settings);
  return { ...defaultApiSettings, ...settings };
}

export async function createApiKey(
  data: Pick<ApiKey, 'name' | 'permissions' | 'expiresAt'>,
): Promise<ApiKey> {
  // TODO: return await api.post('/admin/settings/api/keys', data);
  console.log('[mock] createApiKey', data);
  return {
    id: `KEY-${Date.now()}`,
    name: data.name,
    key: `bm_live_${Math.random().toString(36).slice(2, 34)}`,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    status: 'active',
    permissions: data.permissions,
    expiresAt: data.expiresAt,
  };
}

export async function revokeApiKey(id: string): Promise<boolean> {
  // TODO: return await api.post(`/admin/settings/api/keys/${id}/revoke`);
  console.log('[mock] revokeApiKey', id);
  return true;
}

// -- Maintenance Settings --

export function getMaintenanceSettings(): MaintenanceSettings {
  // TODO: return await api.get('/admin/settings/maintenance');
  return { ...defaultMaintenanceSettings };
}

export async function updateMaintenanceSettings(
  settings: Partial<MaintenanceSettings>,
): Promise<MaintenanceSettings> {
  // TODO: return await api.patch('/admin/settings/maintenance', settings);
  console.log('[mock] updateMaintenanceSettings', settings);
  return { ...defaultMaintenanceSettings, ...settings };
}

export async function toggleMaintenanceMode(enabled: boolean): Promise<boolean> {
  // TODO: return await api.post('/admin/settings/maintenance/toggle', { enabled });
  console.log('[mock] toggleMaintenanceMode', enabled);
  return true;
}

export function getMaintenanceHistory(): MaintenanceHistoryEntry[] {
  // TODO: return await api.get('/admin/settings/maintenance/history');
  return mockMaintenanceHistory.map((e) => ({ ...e }));
}

export function getSystemStatus(): SystemStatus {
  // TODO: return await api.get('/admin/system/status');
  return { ...mockSystemStatus };
}

export async function performMaintenanceAction(
  action: 'optimize-db' | 'clear-cache' | 'restart-services' | 'security-scan',
): Promise<MaintenanceHistoryEntry> {
  // TODO: return await api.post('/admin/settings/maintenance/actions', { action });
  console.log('[mock] performMaintenanceAction', action);
  const labels: Record<string, string> = {
    'optimize-db': 'Database Optimization',
    'clear-cache': 'System Cache Clear',
    'restart-services': 'Service Restart',
    'security-scan': 'Security Scan',
  };
  return {
    id: `MNT-${Date.now()}`,
    task: labels[action] || action,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: '0 min',
    status: 'in-progress',
    details: `${labels[action]} initiated…`,
    performedBy: 'Admin User',
  };
}

// -- Backup & Restore --

export function getBackupSettings(): BackupSettings {
  // TODO: return await api.get('/admin/settings/backup');
  return { ...defaultBackupSettings };
}

export async function updateBackupSettings(
  settings: Partial<BackupSettings>,
): Promise<BackupSettings> {
  // TODO: return await api.patch('/admin/settings/backup', settings);
  console.log('[mock] updateBackupSettings', settings);
  return { ...defaultBackupSettings, ...settings };
}

export function getBackupHistory(): BackupEntry[] {
  // TODO: return await api.get('/admin/settings/backup/history');
  return mockBackupHistory.map((e) => ({ ...e }));
}

export function getBackupStats(): BackupStats {
  // TODO: return await api.get('/admin/settings/backup/stats');
  return { ...mockBackupStats };
}

export async function createBackup(
  type: BackupEntry['type'],
): Promise<BackupEntry> {
  // TODO: return await api.post('/admin/settings/backup', { type });
  console.log('[mock] createBackup', type);
  return {
    id: `BKP-${Date.now()}`,
    type,
    date: new Date().toISOString(),
    size: '0 KB',
    status: 'in-progress',
    duration: '0 min',
    location: defaultBackupSettings.storageLocation === 'aws-s3' ? 'AWS S3' : 'Local Storage',
    encryptionEnabled: defaultBackupSettings.encryptBackups,
  };
}

export async function restoreBackup(id: string): Promise<boolean> {
  // TODO: return await api.post(`/admin/settings/backup/${id}/restore`);
  console.log('[mock] restoreBackup', id);
  return true;
}

export async function deleteBackup(id: string): Promise<boolean> {
  // TODO: return await api.delete(`/admin/settings/backup/${id}`);
  console.log('[mock] deleteBackup', id);
  return true;
}

export async function downloadBackup(id: string): Promise<boolean> {
  // TODO: return await api.get(`/admin/settings/backup/${id}/download`, { responseType: 'blob' });
  console.log('[mock] downloadBackup', id);
  return true;
}
