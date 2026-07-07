import { getCookie } from '@/lib/utils/cookieUtils';

const NOTIFICATION_API_BASE = process.env.NEXT_PUBLIC_NOTIFICATION_MANAGEMENT_API_URL || 'http://localhost:8080';

export interface SendNotificationRequest {
    title: string;
    subject: string;
    body: string;
    messageType: 'info' | 'warning' | 'critical' | 'maintenance';
    targetAudience: 'all' | 'passengers' | 'conductors' | 'mot_officers' | 'fleet_operators';
    province?: string;
    city?: string;
    route?: string;
}

export interface SendNotificationResponse {
    message: string;
    notificationId: string;
    stats: {
        successful: number;
        failed: number;
        totalSent: number;
        web: {
            successful: number;
            failed: number;
        };
        mobile: {
            successful: number;
            failed: number;
        };
    };
}

export interface NotificationDetails {
    notificationId: string;
    title: string;
    subject: string;
    body: string;
    messageType: string;
    targetAudience: string;
    province?: string;
    city?: string;
    route?: string;
    createdAt: string;
    adminId: string;
}

export interface NotificationListItem {
    notificationId: string;
    adminId?: string;
    title: string;
    body: string;
    createdAt: string;
    messageType?: string;
    targetAudience?: string;
    senderRole?: string;
}

/**
 * Send a notification via the notification management service
 */
export async function sendNotification(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    const authToken = getCookie('access_token');

    if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(`${NOTIFICATION_API_BASE}/api/notifications/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send notification' }));
        throw new Error(errorData.message || `Failed to send notification: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Get notification details by ID
 */
export async function getNotificationDetails(notificationId: string): Promise<NotificationDetails> {
    const authToken = getCookie('access_token');

    if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(`${NOTIFICATION_API_BASE}/api/notifications/details/${notificationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get notification details' }));
        throw new Error(errorData.message || `Failed to get notification details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.notification;
}

/**
 * List recent notifications
 */
export async function listNotifications(limit: number = 50): Promise<NotificationListItem[]> {
    const authToken = getCookie('access_token');

    if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(`${NOTIFICATION_API_BASE}/api/notifications/list?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to list notifications' }));
        throw new Error(errorData.message || `Failed to list notifications: ${response.statusText}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.notifications) ? data.notifications : [];
    // Map backend fields to frontend shape
    return items.map((n: any) => ({
        notificationId: n.notificationId,
        adminId: n.adminId,
        title: n.title,
        body: n.body ?? n.content ?? '',
        createdAt: n.createdAt ?? n.dateCreated ?? n.sentAt ?? '',
        messageType: n.messageType,
        targetAudience: n.targetAudience,
        senderRole: n.senderRole,
    }));
}

/** Delete a notification by id */
export async function deleteNotification(notificationId: string): Promise<void> {
    const authToken = getCookie('access_token');
    if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
    }

    const response = await fetch(`${NOTIFICATION_API_BASE}/api/notifications/delete/${notificationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        throw new Error(errorData.message || `Failed to delete notification: ${response.statusText}`);
    }
}

/**
 * Record notification click
 */
export async function recordNotificationClick(notificationId: string): Promise<void> {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/notifications/click`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to record notification click' }));
        throw new Error(errorData.message || `Failed to record notification click: ${response.statusText}`);
    }
}

/**
 * Helper function to map UI target groups to API target audience
 */
export function mapTargetGroupsToAudience(targetGroups: string[]): 'all' | 'passengers' | 'conductors' | 'mot_officers' | 'fleet_operators' {
    // If "All Users" is selected or all groups are selected, return 'all'
    if (targetGroups.includes("All Users") || targetGroups.length >= 5) {
        return 'all';
    }

    // Map individual groups
    if (targetGroups.includes("Passengers")) {
        return 'passengers';
    }
    if (targetGroups.includes("Conductors")) {
        return 'conductors';
    }
    if (targetGroups.includes("Drivers")) {
        // Drivers might be conductors in the backend system
        return 'conductors';
    }
    if (targetGroups.includes("Fleet Operators") || targetGroups.includes("Bus Operators")) {
        return 'fleet_operators';
    }

    // Default to all if no specific match
    return 'all';
}

/**
 * Helper function to map UI priority to API message type
 */
export function mapPriorityToMessageType(priority: string): 'info' | 'warning' | 'critical' | 'maintenance' {
    switch (priority.toLowerCase()) {
        case 'high':
            return 'critical';
        case 'medium':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'info';
    }
}

/**
 * Helper function to map UI category to message type if more specific
 */
export function mapCategoryToMessageType(category: string): 'info' | 'warning' | 'critical' | 'maintenance' {
    switch (category.toLowerCase()) {
        case 'emergency':
            return 'critical';
        case 'maintenance':
            return 'maintenance';
        case 'route update':
        case 'policy':
            return 'warning';
        default:
            return 'info';
    }
}
