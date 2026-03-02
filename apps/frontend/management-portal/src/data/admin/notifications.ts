// Notification mock data for admin portal
// Replace these functions with API calls when backend is ready

import { Notification } from './types';

// ──────────────────────────────────────────
// Mock Notifications (extended dataset)
// ──────────────────────────────────────────
const mockNotifications: Notification[] = [
  {
    id: 'NTF-001',
    title: 'Scheduled System Maintenance',
    body: 'The platform will undergo scheduled maintenance on March 1, 2026 from 2:00 AM to 5:00 AM IST. During this window GPS tracking, ticketing, and push notification services will be temporarily unavailable.',
    type: 'maintenance',
    priority: 'high',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-21T08:00:00Z',
    sentAt: '2026-02-21T08:00:45Z',
    readCount: 18420,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'push',
  },
  {
    id: 'NTF-002',
    title: 'Fare Revision Effective March 2026',
    body: 'Updated fare structure for inter-city routes is effective from 1 March 2026. Economy fares adjusted by +5 %. See the Fare Management section for the full schedule.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'passengers',
    status: 'sent',
    createdAt: '2026-02-20T14:30:00Z',
    sentAt: '2026-02-20T14:31:00Z',
    readCount: 9200,
    totalRecipients: 12500,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'push',
  },
  {
    id: 'NTF-003',
    title: 'Critical: Payment Gateway Outage',
    body: 'The primary payment gateway is experiencing intermittent failures. The engineering team is actively investigating. Card payments may be delayed. Mobile wallet payments remain unaffected.',
    type: 'critical',
    priority: 'critical',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-21T11:15:00Z',
    sentAt: '2026-02-21T11:15:10Z',
    readCount: 21300,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'push',
  },
  {
    id: 'NTF-004',
    title: 'Route BC-138 Disruption',
    body: 'Route BC-138 (Colombo → Kandy via A1) is diverted between Kadawatha and Warakapola due to road works. Expect 20–30 min additional travel time. Diversion valid until 28 Feb 2026.',
    type: 'warning',
    priority: 'high',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-19T07:45:00Z',
    sentAt: '2026-02-19T07:45:20Z',
    readCount: 14800,
    totalRecipients: 25000,
    senderId: 'MOT-002',
    senderName: 'Traffic Control',
    channel: 'push',
  },
  {
    id: 'NTF-005',
    title: 'Monthly Performance Report – January 2026',
    body: 'Your January 2026 fleet performance report is now available in Analytics → Reports. Key highlights: on-time rate 91 %, fuel efficiency improved 3 %, zero safety incidents.',
    type: 'info',
    priority: 'low',
    targetAudience: 'fleet_operators',
    status: 'sent',
    createdAt: '2026-02-01T09:00:00Z',
    sentAt: '2026-02-01T09:01:00Z',
    readCount: 155,
    totalRecipients: 180,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'email',
  },
  {
    id: 'NTF-006',
    title: 'Customer Service Training Module',
    body: 'A new mandatory training module on passenger customer service is now available. Please complete by 15 March 2026. Access via Training → New Modules.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'conductors',
    status: 'scheduled',
    createdAt: '2026-02-20T16:00:00Z',
    scheduledFor: '2026-02-25T08:00:00Z',
    readCount: 0,
    totalRecipients: 450,
    senderId: 'ADM-001',
    senderName: 'HR Admin',
    channel: 'push',
  },
  {
    id: 'NTF-007',
    title: 'Weekend Schedule Override',
    body: 'Special weekend schedule in effect for 22–23 Feb 2026 due to the Navam Perahera. Cross-city services reduced by 30 %. Check your updated roster in the Timekeeper portal.',
    type: 'warning',
    priority: 'medium',
    targetAudience: 'timekeepers',
    status: 'draft',
    createdAt: '2026-02-19T15:00:00Z',
    readCount: 0,
    totalRecipients: 120,
    senderId: 'MOT-001',
    senderName: 'Schedule Manager',
    channel: 'push',
  },
  {
    id: 'NTF-008',
    title: 'GPS Tracker Firmware Update',
    body: 'A mandatory firmware update (v3.4.1) is available for all GPS tracking devices. Fleet operators must update by 28 Feb 2026 to continue real-time tracking.',
    type: 'info',
    priority: 'high',
    targetAudience: 'fleet_operators',
    status: 'sent',
    createdAt: '2026-02-18T10:30:00Z',
    sentAt: '2026-02-18T10:31:00Z',
    readCount: 142,
    totalRecipients: 180,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'email',
  },
  {
    id: 'NTF-009',
    title: 'Successful Database Migration',
    body: 'Database migration to PostgreSQL 16 completed successfully with zero data loss. All services are operating normally. No action required.',
    type: 'success',
    priority: 'low',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-17T04:00:00Z',
    sentAt: '2026-02-17T04:00:30Z',
    readCount: 3200,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'push',
  },
  {
    id: 'NTF-010',
    title: 'New MOT Compliance Deadline',
    body: 'All fleet operators must submit Q1 2026 compliance documents by 31 March 2026. Late submissions will incur penalties per MOT regulation 4.2.1.',
    type: 'warning',
    priority: 'high',
    targetAudience: 'mot_officers',
    status: 'sent',
    createdAt: '2026-02-16T12:00:00Z',
    sentAt: '2026-02-16T12:01:00Z',
    readCount: 42,
    totalRecipients: 55,
    senderId: 'MOT-001',
    senderName: 'Compliance Officer',
    channel: 'email',
  },
  {
    id: 'NTF-011',
    title: 'Holiday Season Capacity Increase',
    body: 'Due to increased demand during the upcoming long weekend, additional buses will be deployed on popular inter-city routes. Conductors may receive updated schedules.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'conductors',
    status: 'scheduled',
    createdAt: '2026-02-21T09:30:00Z',
    scheduledFor: '2026-02-28T06:00:00Z',
    readCount: 0,
    totalRecipients: 450,
    senderId: 'ADM-001',
    senderName: 'Operations Manager',
    channel: 'push',
  },
  {
    id: 'NTF-012',
    title: 'Mobile App v4.2 Release',
    body: 'BusMate mobile app version 4.2 is now available on iOS and Android. New features: offline ticket validation, improved GPS accuracy, and dark mode.',
    type: 'success',
    priority: 'low',
    targetAudience: 'passengers',
    status: 'sent',
    createdAt: '2026-02-15T11:00:00Z',
    sentAt: '2026-02-15T11:01:00Z',
    readCount: 7800,
    totalRecipients: 12500,
    senderId: 'ADM-001',
    senderName: 'Product Team',
    channel: 'push',
  },
  {
    id: 'NTF-013',
    title: 'Security Alert: Phishing Attempt',
    body: 'We have detected phishing emails imitating BusMate communications. Never share your login credentials via email. Always use the official portal for sign-in.',
    type: 'critical',
    priority: 'critical',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-14T16:45:00Z',
    sentAt: '2026-02-14T16:45:15Z',
    readCount: 19500,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'Security Team',
    channel: 'push',
  },
  {
    id: 'NTF-014',
    title: 'Timekeeper Shift Policy Update',
    body: 'New shift rotation policy effective from 1 March 2026. Maximum continuous shift reduced to 8 hours. Please review the updated policy document in HR portal.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'timekeepers',
    status: 'draft',
    createdAt: '2026-02-21T13:20:00Z',
    readCount: 0,
    totalRecipients: 120,
    senderId: 'ADM-001',
    senderName: 'HR Admin',
    channel: 'email',
  },
  {
    id: 'NTF-015',
    title: 'Route BC-245 Service Restored',
    body: 'Route BC-245 (Colombo → Galle) is now running on normal schedule after yesterday\'s disruption caused by flooding near Aluthgama. Thank you for your patience.',
    type: 'success',
    priority: 'medium',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-13T06:30:00Z',
    sentAt: '2026-02-13T06:30:45Z',
    readCount: 11200,
    totalRecipients: 25000,
    senderId: 'MOT-002',
    senderName: 'Traffic Control',
    channel: 'push',
  },
  {
    id: 'NTF-016',
    title: 'Fleet Insurance Renewal Reminder',
    body: 'Insurance policies for 23 buses are expiring within the next 30 days. Please initiate renewals via Fleet Management → Insurance to avoid service interruptions.',
    type: 'warning',
    priority: 'high',
    targetAudience: 'fleet_operators',
    status: 'sent',
    createdAt: '2026-02-12T10:00:00Z',
    sentAt: '2026-02-12T10:01:00Z',
    readCount: 168,
    totalRecipients: 180,
    senderId: 'ADM-001',
    senderName: 'Fleet Management',
    channel: 'email',
  },
  {
    id: 'NTF-017',
    title: 'Revenue Report Q4 2025',
    body: 'The quarterly revenue report for Q4 2025 has been published. Total revenue up 12 % YoY. Digital payments now account for 67 % of all transactions.',
    type: 'info',
    priority: 'low',
    targetAudience: 'mot_officers',
    status: 'sent',
    createdAt: '2026-02-10T09:00:00Z',
    sentAt: '2026-02-10T09:01:00Z',
    readCount: 48,
    totalRecipients: 55,
    senderId: 'ADM-001',
    senderName: 'Analytics Team',
    channel: 'email',
  },
  {
    id: 'NTF-018',
    title: 'Conductor ID Card Collection',
    body: 'New digital ID cards are ready for collection at regional offices. Bring your current ID card for exchange. Collection available Mon-Fri 9 AM - 4 PM.',
    type: 'info',
    priority: 'medium',
    targetAudience: 'conductors',
    status: 'scheduled',
    scheduledFor: '2026-03-01T08:00:00Z',
    createdAt: '2026-02-21T14:00:00Z',
    readCount: 0,
    totalRecipients: 450,
    senderId: 'ADM-001',
    senderName: 'HR Admin',
    channel: 'push',
  },
  {
    id: 'NTF-019',
    title: 'API Rate Limit Increase',
    body: 'The API rate limit for third-party integrations has been increased from 1,000 to 5,000 requests per minute. Update your integration configurations if applicable.',
    type: 'info',
    priority: 'low',
    targetAudience: 'fleet_operators',
    status: 'draft',
    createdAt: '2026-02-21T10:45:00Z',
    readCount: 0,
    totalRecipients: 180,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: 'email',
  },
  {
    id: 'NTF-020',
    title: 'Emergency: Severe Weather Warning',
    body: 'Heavy rainfall and flooding expected across Southern Province on 22-23 Feb. Routes BC-245, BC-310, and BC-412 may be suspended. Monitor real-time updates.',
    type: 'critical',
    priority: 'critical',
    targetAudience: 'all',
    status: 'sent',
    createdAt: '2026-02-21T15:00:00Z',
    sentAt: '2026-02-21T15:00:05Z',
    readCount: 22100,
    totalRecipients: 25000,
    senderId: 'MOT-002',
    senderName: 'Emergency Response',
    channel: 'push',
  },
];

// ──────────────────────────────────────────
// Statistics & Analytics
// ──────────────────────────────────────────

export interface NotificationStats {
  totalNotifications: number;
  totalSent: number;
  totalScheduled: number;
  totalDraft: number;
  totalFailed: number;
  averageReadRate: number;
  totalRecipients: number;
  // Type breakdown
  infoCount: number;
  warningCount: number;
  criticalCount: number;
  successCount: number;
  maintenanceCount: number;
  // Audience breakdown
  audienceBreakdown: { audience: string; count: number }[];
  // Priority breakdown
  priorityBreakdown: { priority: string; count: number }[];
  // Trends (last 7 days)
  dailyCounts: { date: string; sent: number; scheduled: number; draft: number }[];
  // Top senders
  topSenders: { name: string; count: number }[];
  // Channel breakdown
  channelBreakdown: { channel: string; count: number }[];
}

function calculateNotificationStats(): NotificationStats {
  const sent = mockNotifications.filter(n => n.status === 'sent');
  const scheduled = mockNotifications.filter(n => n.status === 'scheduled');
  const drafts = mockNotifications.filter(n => n.status === 'draft');
  const failed = mockNotifications.filter(n => n.status === 'failed');

  const totalRead = sent.reduce((sum, n) => sum + n.readCount, 0);
  const totalRecipients = sent.reduce((sum, n) => sum + n.totalRecipients, 0);
  const avgRate = totalRecipients > 0 ? Math.round((totalRead / totalRecipients) * 1000) / 10 : 0;

  const typeCount = (type: string) => mockNotifications.filter(n => n.type === type).length;

  const audiences = ['all', 'passengers', 'conductors', 'fleet_operators', 'mot_officers', 'timekeepers'];
  const audienceBreakdown = audiences
    .map(a => ({
      audience: a.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: mockNotifications.filter(n => n.targetAudience === a).length,
    }))
    .filter(a => a.count > 0);

  const priorities = ['critical', 'high', 'medium', 'low'];
  const priorityBreakdown = priorities
    .map(p => ({
      priority: p.charAt(0).toUpperCase() + p.slice(1),
      count: mockNotifications.filter(n => n.priority === p).length,
    }))
    .filter(p => p.count > 0);

  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-02-21');
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayItems = mockNotifications.filter(n => n.createdAt.startsWith(dateStr));
    return {
      date: dateStr,
      sent: dayItems.filter(n => n.status === 'sent').length,
      scheduled: dayItems.filter(n => n.status === 'scheduled').length,
      draft: dayItems.filter(n => n.status === 'draft').length,
    };
  });

  const senderMap = new Map<string, number>();
  mockNotifications.forEach(n => senderMap.set(n.senderName, (senderMap.get(n.senderName) || 0) + 1));
  const topSenders = Array.from(senderMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const channelMap = new Map<string, number>();
  mockNotifications.forEach(n => {
    const ch = n.channel || 'push';
    channelMap.set(ch, (channelMap.get(ch) || 0) + 1);
  });
  const channelBreakdown = Array.from(channelMap.entries())
    .map(([channel, count]) => ({ channel: channel.charAt(0).toUpperCase() + channel.slice(1), count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalNotifications: mockNotifications.length,
    totalSent: sent.length,
    totalScheduled: scheduled.length,
    totalDraft: drafts.length,
    totalFailed: failed.length,
    averageReadRate: avgRate,
    totalRecipients,
    infoCount: typeCount('info'),
    warningCount: typeCount('warning'),
    criticalCount: typeCount('critical'),
    successCount: typeCount('success'),
    maintenanceCount: typeCount('maintenance'),
    audienceBreakdown,
    priorityBreakdown,
    channelBreakdown,
    dailyCounts,
    topSenders,
  };
}

const cachedStats = calculateNotificationStats();

// ──────────────────────────────────────────
// API Functions (replace with real calls)
// ──────────────────────────────────────────

export function getNotifications(limit?: number): Notification[] {
  const sorted = [...mockNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getNotificationById(id: string): Notification | null {
  return mockNotifications.find(n => n.id === id) || null;
}

export function getNotificationStats(): NotificationStats {
  return cachedStats;
}

export function getSentNotifications(limit?: number): Notification[] {
  const sent = mockNotifications
    .filter(n => n.status === 'sent')
    .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime());
  return limit ? sent.slice(0, limit) : sent;
}

export function getScheduledNotifications(limit?: number): Notification[] {
  const scheduled = mockNotifications
    .filter(n => n.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime());
  return limit ? scheduled.slice(0, limit) : scheduled;
}

export function getDraftNotifications(limit?: number): Notification[] {
  const drafts = mockNotifications
    .filter(n => n.status === 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? drafts.slice(0, limit) : drafts;
}

export function getReceivedNotifications(): Notification[] {
  return mockNotifications
    .filter(n => n.senderId !== 'ADM-001')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterNotifications(filters: {
  status?: string;
  type?: string;
  priority?: string;
  targetAudience?: string;
  channel?: string;
  search?: string;
}): Notification[] {
  return mockNotifications.filter(n => {
    if (filters.status && filters.status !== 'all' && n.status !== filters.status) return false;
    if (filters.type && filters.type !== 'all' && n.type !== filters.type) return false;
    if (filters.priority && filters.priority !== 'all' && n.priority !== filters.priority) return false;
    if (filters.targetAudience && filters.targetAudience !== 'all' && n.targetAudience !== filters.targetAudience) return false;
    if (filters.channel && filters.channel !== 'all' && n.channel !== filters.channel) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      return (
        n.title.toLowerCase().includes(term) ||
        n.body.toLowerCase().includes(term) ||
        n.senderName.toLowerCase().includes(term)
      );
    }
    return true;
  });
}

export async function sendNotification(data: Partial<Notification>): Promise<Notification> {
  console.log('Sending notification:', data);
  return {
    id: `NTF-${Date.now()}`,
    title: data.title || '',
    body: data.body || '',
    type: data.type || 'info',
    priority: data.priority || 'medium',
    targetAudience: data.targetAudience || 'all',
    status: 'sent',
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    readCount: 0,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'System Admin',
    channel: data.channel || 'push',
  };
}

export async function scheduleNotification(
  data: Partial<Notification>,
  scheduledFor: string,
): Promise<Notification> {
  console.log('Scheduling notification:', data, 'for:', scheduledFor);
  return {
    ...data,
    id: `NTF-${Date.now()}`,
    status: 'scheduled',
    scheduledFor,
    createdAt: new Date().toISOString(),
    readCount: 0,
    totalRecipients: 25000,
    senderId: 'ADM-001',
    senderName: 'System Admin',
  } as Notification;
}

export async function deleteNotification(id: string): Promise<boolean> {
  console.log(`Deleting notification ${id}`);
  return true;
}

export function getUniqueAudiences(): string[] {
  return [...new Set(mockNotifications.map(n => n.targetAudience))];
}

export function getUniqueSenders(): string[] {
  return [...new Set(mockNotifications.map(n => n.senderName))];
}

export const mockData = {
  notifications: mockNotifications,
  notificationStats: cachedStats,
};
