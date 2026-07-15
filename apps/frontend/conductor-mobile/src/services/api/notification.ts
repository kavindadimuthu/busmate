import {
  Notification,
  NotificationDetailResponse,
  NotificationListParams,
  NotificationResponse,
} from '@/types/notification';

// ---------------------------------------------------------------------------
// PLACEHOLDER — the BusMate notification backend service does not exist yet.
//
// This module returns local static mock data so the notification screens stay
// functional without depending on any external service. Once the notification
// service is built, replace this file with a generated shared API client
// (e.g. @busmate/api-client-notification) routed through the API gateway.
// ---------------------------------------------------------------------------

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 'mock-1',
    adminId: 'admin-001',
    title: 'Route 138 schedule updated',
    body: 'The evening timetable for Route 138 (Colombo – Maharagama) has been revised. Please review your assigned trips.',
    createdAt: '2026-07-15T09:30:00.000Z',
    messageType: 'info',
    targetAudience: 'conductors',
    senderRole: 'fleet_operator',
    subject: 'Schedule update',
    province: 'Western',
    city: 'Colombo',
    route: 'Route 138',
  },
  {
    notificationId: 'mock-2',
    adminId: 'admin-002',
    title: 'Fare revision effective Monday',
    body: 'Base fares increase by LKR 5 across all stages from Monday. Updated fare tables are available in the app.',
    createdAt: '2026-07-14T14:05:00.000Z',
    messageType: 'warning',
    targetAudience: 'all',
    senderRole: 'mot_officer',
    subject: 'Fare revision',
  },
  {
    notificationId: 'mock-3',
    adminId: 'admin-003',
    title: 'Vehicle inspection reminder',
    body: 'Your assigned bus is due for its monthly safety inspection this week. Coordinate with your depot.',
    createdAt: '2026-07-12T07:45:00.000Z',
    messageType: 'info',
    targetAudience: 'conductors',
    senderRole: 'fleet_operator',
    subject: 'Inspection reminder',
  },
];

// Simulate a small async delay so loading states still behave realistically.
const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const notificationApi = {
  // Returns the mock notification list (params accepted for signature parity).
  getNotificationsList: async (_params?: NotificationListParams): Promise<NotificationResponse> => {
    return delay({ notifications: MOCK_NOTIFICATIONS });
  },

  // Returns a single mock notification by id (falls back to the first entry).
  getNotificationDetails: async (notificationId: string): Promise<NotificationDetailResponse> => {
    const match = MOCK_NOTIFICATIONS.find((n) => n.notificationId === notificationId);
    return delay({ notification: match ?? MOCK_NOTIFICATIONS[0] });
  },
};
