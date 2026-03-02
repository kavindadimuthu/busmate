// Dashboard mock data for admin portal
// Replace these functions with API calls when backend is ready

import { DashboardStats, ActivityItem, QuickActionItem } from './types';

// Mock dashboard stats
const mockDashboardStats: DashboardStats = {
  totalUsers: 1920847,
  totalUsersChange: '+12.5%',
  systemUptime: '99.9%',
  uptimeStatus: 'Excellent',
  criticalAlerts: 3,
  alertsStatus: 'Needs attention',
  totalBuses: 15621,
  busesChange: '+5 new',
  dailyTransactions: 'Rs 1.4M',
  transactionsLabel: 'Today',
};

// Mock activity feed data
const mockActivityFeed: ActivityItem[] = [
  {
    id: '1',
    user: 'John Doe',
    action: 'login',
    target: 'Mobile App',
    time: '2 minutes ago',
    type: 'user',
  },
  {
    id: '2',
    user: 'System',
    action: 'backup_completed',
    target: 'Database',
    time: '15 minutes ago',
    type: 'system',
  },
  {
    id: '3',
    user: 'Security Bot',
    action: 'blocked',
    target: 'Suspicious IP 192.168.1.100',
    time: '30 minutes ago',
    type: 'security',
  },
  {
    id: '4',
    user: 'Payment System',
    action: 'processed',
    target: '1,247 transactions',
    time: '1 hour ago',
    type: 'transaction',
  },
  {
    id: '5',
    user: 'Admin User',
    action: 'created',
    target: 'New MOT Officer account',
    time: '2 hours ago',
    type: 'user',
  },
  {
    id: '6',
    user: 'System',
    action: 'updated',
    target: 'Route schedules for Route BC-138',
    time: '3 hours ago',
    type: 'system',
  },
  {
    id: '7',
    user: 'Fleet Operator',
    action: 'registered',
    target: '3 new buses',
    time: '4 hours ago',
    type: 'user',
  },
  {
    id: '8',
    user: 'System',
    action: 'alert',
    target: 'High server load detected',
    time: '5 hours ago',
    type: 'system',
  },
];

// Mock quick actions
const mockQuickActions: QuickActionItem[] = [
  {
    id: '1',
    title: 'Add New User',
    description: 'Create a new MOT officer account',
    icon: 'UserPlus',
    href: '/admin/users/add-mot',
    color: 'blue',
  },
  {
    id: '2',
    title: 'Send Notification',
    description: 'Broadcast message to users',
    icon: 'Bell',
    href: '/admin/notifications/compose',
    color: 'green',
  },
  {
    id: '3',
    title: 'System Logs',
    description: 'Browse system activity logs',
    icon: 'FileText',
    href: '/admin/logs',
    color: 'purple',
  },
  {
    id: '4',
    title: 'System Backup',
    description: 'Create manual backup',
    icon: 'Database',
    href: '/admin/settings/backup',
    color: 'orange',
  },
  {
    id: '5',
    title: 'View Logs',
    description: 'Check system logs',
    icon: 'FileText',
    href: '/admin/logs',
    color: 'gray',
  },
  {
    id: '6',
    title: 'System Monitoring',
    description: 'Monitor system health',
    icon: 'Activity',
    href: '/admin/monitoring',
    color: 'teal',
  },
];

// Mock user growth data for chart
const mockUserGrowthData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Passengers',
      data: [12000, 19000, 25000, 35000, 42000, 55000, 68000, 82000, 95000, 110000, 125000, 145000],
      color: '#3B82F6',
    },
    {
      label: 'Conductors',
      data: [500, 650, 800, 950, 1100, 1250, 1400, 1550, 1700, 1850, 2000, 2200],
      color: '#10B981',
    },
    {
      label: 'Fleet Operators',
      data: [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350],
      color: '#F59E0B',
    },
  ],
};

// API functions (to be replaced with real API calls)
export function getDashboardStats(): DashboardStats {
  // TODO: Replace with API call
  // return await api.get('/admin/dashboard/stats');
  return mockDashboardStats;
}

export function getActivityFeed(limit: number = 10): ActivityItem[] {
  // TODO: Replace with API call
  // return await api.get(`/admin/dashboard/activity?limit=${limit}`);
  return mockActivityFeed.slice(0, limit);
}

export function getQuickActions(): QuickActionItem[] {
  // TODO: Replace with API call
  // return await api.get('/admin/dashboard/quick-actions');
  return mockQuickActions;
}

export function getUserGrowthData() {
  // TODO: Replace with API call
  // return await api.get('/admin/analytics/user-growth');
  return mockUserGrowthData;
}

// Export mock data for direct access if needed
export const mockData = {
  dashboardStats: mockDashboardStats,
  activityFeed: mockActivityFeed,
  quickActions: mockQuickActions,
  userGrowthData: mockUserGrowthData,
};
