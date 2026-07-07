import { apiClient } from '../apiClient';
import { NotificationResponse, NotificationListParams, NotificationDetailResponse } from '@/types/notification';

export const notificationApi = {
  // Get notifications list from Notification Management Service
  getNotificationsList: async (params?: NotificationListParams): Promise<NotificationResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = queryParams.toString()
      ? `/notifications/list?${queryParams.toString()}`
      : '/notifications/list';

    return apiClient.authenticatedRequest<NotificationResponse>(endpoint, {}, 'notification');
  },

  // Get a single notification's details
  getNotificationDetails: async (notificationId: string): Promise<NotificationDetailResponse> => {
    const endpoint = `/notifications/details/${encodeURIComponent(notificationId)}`;
    return apiClient.authenticatedRequest<NotificationDetailResponse>(endpoint, {}, 'notification');
  },

  // Get notifications for conductor - User Management Service (Legacy)
  getNotifications: async (conductorId: string): Promise<any[]> => {
    return apiClient.authenticatedRequest<any[]>(`/notifications?conductorId=${conductorId}`, {}, 'user');
  },

  // Send notification to passengers - User Management Service
  notifyPassengers: async (notification: any): Promise<any> => {
    return apiClient.authenticatedRequest<any>('/notify-passengers', {
      method: 'POST',
      body: JSON.stringify(notification),
    }, 'user');
  },

  // Mark notification as read - User Management Service
  markAsRead: async (notificationId: string): Promise<any> => {
    return apiClient.authenticatedRequest<any>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }, 'user');
  },

  // Get conductor notifications - User Management Service (Legacy)
  getConductorNotifications: async (conductorId: string): Promise<any[]> => {
    return apiClient.authenticatedRequest<any[]>(`/conductor-notifications?conductorId=${conductorId}`, {}, 'user');
  },
};
