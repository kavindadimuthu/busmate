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

// User management data and functions — backed by the real user-management API
// (see @/lib/api/adminUsers), this module only shapes/labels/formats it for the UI.
export {
  toAdminUser,
  getUserDisplayName,
  formatDateShort,
  timeAgo,
  formatProfileFieldLabel,
  // Config maps
  USER_TYPE_CONFIG,
  USER_TYPE_ORDER,
  USER_STATUS_CONFIG,
  USER_STATUS_ORDER,
} from './users';
export type {
  UserType,
  UserStatus,
  AdminUser,
  UserStats,
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
