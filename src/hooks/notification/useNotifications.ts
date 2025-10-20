import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '@/services/api/notification';
import { Notification, NotificationListParams } from '@/types/notification';

export interface UseNotificationsReturn {
    notifications: Notification[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    fetchNotifications: (params?: NotificationListParams) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

export const useNotifications = (autoFetch = true): UseNotificationsReturn => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async (params?: NotificationListParams) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await notificationApi.getNotificationsList(params);
            setNotifications(response.notifications);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
            setError(errorMessage);
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            const response = await notificationApi.getNotificationsList();
            setNotifications(response.notifications);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh notifications';
            setError(errorMessage);
            console.error('Failed to refresh notifications:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchNotifications();
        }
    }, [autoFetch, fetchNotifications]);

    return {
        notifications,
        isLoading,
        isRefreshing,
        error,
        fetchNotifications,
        refreshNotifications,
    };
};
