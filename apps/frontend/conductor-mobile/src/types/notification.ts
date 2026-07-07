export interface NotificationResponse {
    notifications: Notification[];
}

// Base notification as returned in list
export interface Notification {
    notificationId: string;
    adminId: string;
    title: string;
    body: string;
    createdAt: string;
    messageType: 'info' | 'warning' | 'error' | 'success';
    targetAudience: string; // e.g., 'conductors', 'all', 'fleet_operators'
    senderRole: string;
    // Optional fields that may appear in detail payload
    subject?: string;
    province?: string;
    city?: string;
    route?: string;
}

export interface NotificationListParams {
    page?: number;
    limit?: number;
}

// Detail response shape
export interface NotificationDetailResponse {
    notification: Notification;
}
