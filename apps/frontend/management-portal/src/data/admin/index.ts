// Admin portal mock data exports
// This file provides a central export point for all admin mock data and API functions

// Type exports
export * from './types';

// Dashboard data and functions
export {
  getDashboardStats,
  getActivityFeed,
  getQuickActions,
  getUserGrowthData,
  mockData as dashboardMockData,
} from './dashboard';

// User management data and functions
export {
  // New API functions
  getAllUsers,
  getUserById,
  getFilteredUsers,
  getUserStatsData,
  updateUser,
  updateUserStatus,
  deleteUserById,
  createUser,
  getUserDisplayName,
  formatUserDate,
  formatDateShort,
  timeAgo,
  // Config maps
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  // Legacy compatibility
  getUsers,
  getUserStats,
  deleteUser,
  createMOTUser,
  getPassengerProfile,
  getConductorProfile,
  getFleetProfile,
  getTimekeeperProfile,
  getMOTProfile,
  mockData as usersMockData,
} from './users';
export type {
  UserType,
  UserStatus,
  UserBase,
  MOTUser,
  TimekeeperUser,
  OperatorUser,
  ConductorUser,
  DriverUser,
  PassengerUser,
  SystemUser,
  UserStatsData,
  UserFiltersState,
  // Legacy types
  PassengerProfile,
  ConductorProfile,
  FleetProfile,
  TimekeeperProfile,
  MOTProfile,
} from './users';

// Notifications data and functions
export {
  getNotifications,
  getNotificationById,
  getNotificationStats,
  getSentNotifications,
  getScheduledNotifications,
  getDraftNotifications,
  getReceivedNotifications,
  filterNotifications,
  sendNotification,
  scheduleNotification,
  deleteNotification,
  getUniqueAudiences,
  getUniqueSenders,
  mockData as notificationsMockData,
} from './notifications';
export type { NotificationStats as NotificationStatsData } from './notifications';

// System Monitoring data and functions
export {
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
} from './system-monitoring';
export type {
  PerformanceSnapshot,
  ResourceSnapshot,
  ApiEndpointMetric,
  MicroserviceInfo,
  MonitoringAlert,
  AlertRule,
  SystemHealthSummary,
} from './system-monitoring';

// Logs data and functions
export {
  getUserActivityLogs,
  getSecurityLogs,
  getApplicationLogs,
  getLogById,
  getLogType,
  getLogStats,
  filterUserActivityLogs,
  filterSecurityLogs,
  filterApplicationLogs,
  getUniqueServices,
  getUniqueUserTypes,
  getUniqueActions,
  exportLogs,
  mockData as logsMockData,
} from './logs';
export type { LogStats } from './logs';

// System Settings data layer (modular, type-safe)
export {
  // General
  getGeneralSettings,
  updateGeneralSettings,
  // API
  getApiSettings,
  updateApiSettings,
  createApiKey,
  revokeApiKey,
  // Maintenance
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenanceMode,
  getMaintenanceHistory,
  getSystemStatus,
  performMaintenanceAction,
  // Backup
  getBackupSettings,
  updateBackupSettings,
  getBackupHistory,
  getBackupStats,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
} from './system-settings';
export type {
  GeneralSettings,
  ApiSettings,
  ApiKey,
  MaintenanceSettings,
  MaintenanceHistoryEntry,
  SystemStatus,
  BackupSettings,
  BackupEntry,
  BackupStats,
} from './system-settings';
