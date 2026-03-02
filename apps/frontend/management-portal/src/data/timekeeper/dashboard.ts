// Dashboard mock data for Time Keeper portal

import { DashboardStats, QuickStat, TripSchedule } from './types';

export const dashboardStats: DashboardStats = {
  totalTripsToday: 48,
  completedTrips: 22,
  activeTrips: 8,
  pendingTrips: 15,
  delayedTrips: 2,
  cancelledTrips: 1,
  onTimePercentage: 92.5,
  busesAtStop: 5,
};

export const quickStats: QuickStat[] = [
  {
    label: 'Today\'s Trips',
    value: 48,
    change: 5,
    changeLabel: 'vs yesterday',
  },
  {
    label: 'On-Time Rate',
    value: '92.5%',
    change: 2.1,
    changeLabel: 'vs last week',
  },
  {
    label: 'Active Buses',
    value: 8,
    change: -1,
    changeLabel: 'vs yesterday',
  },
  {
    label: 'Staff Present',
    value: 12,
    change: 0,
    changeLabel: 'expected: 12',
  },
];

export const upcomingDepartures: TripSchedule[] = [
  {
    id: 'trip-001',
    tripId: 'T-2026-001',
    routeName: 'Colombo - Kandy (138)',
    busNumber: 'NA-1234',
    scheduledTime: '08:30',
    estimatedTime: '08:30',
    status: 'boarding',
    platform: 'A1',
  },
  {
    id: 'trip-002',
    tripId: 'T-2026-002',
    routeName: 'Colombo - Galle (2)',
    busNumber: 'WP-5678',
    scheduledTime: '08:45',
    estimatedTime: '08:50',
    status: 'scheduled',
    platform: 'B2',
  },
  {
    id: 'trip-003',
    tripId: 'T-2026-003',
    routeName: 'Colombo - Negombo (240)',
    busNumber: 'NW-9012',
    scheduledTime: '09:00',
    estimatedTime: '09:05',
    status: 'scheduled',
    platform: 'A3',
  },
  {
    id: 'trip-004',
    tripId: 'T-2026-004',
    routeName: 'Colombo - Matara (32)',
    busNumber: 'SP-3456',
    scheduledTime: '09:15',
    estimatedTime: '09:15',
    status: 'scheduled',
    platform: 'C1',
  },
  {
    id: 'trip-005',
    tripId: 'T-2026-005',
    routeName: 'Colombo - Kurunegala (6)',
    busNumber: 'NW-7890',
    scheduledTime: '09:30',
    estimatedTime: '09:35',
    status: 'delayed',
    platform: 'A2',
  },
];

export const recentTrips: TripSchedule[] = [
  {
    id: 'trip-past-001',
    tripId: 'T-2026-P01',
    routeName: 'Colombo - Kandy (138)',
    busNumber: 'NA-1111',
    scheduledTime: '07:30',
    estimatedTime: '07:28',
    status: 'departed',
    platform: 'A1',
  },
  {
    id: 'trip-past-002',
    tripId: 'T-2026-P02',
    routeName: 'Colombo - Galle (2)',
    busNumber: 'SP-2222',
    scheduledTime: '07:45',
    estimatedTime: '07:52',
    status: 'departed',
    platform: 'B1',
  },
  {
    id: 'trip-past-003',
    tripId: 'T-2026-P03',
    routeName: 'Colombo - Negombo (240)',
    busNumber: 'WP-3333',
    scheduledTime: '08:00',
    estimatedTime: '08:00',
    status: 'departed',
    platform: 'A2',
  },
];

// Helper function to get dashboard stats
export function getDashboardStats(): DashboardStats {
  return { ...dashboardStats };
}

// Helper function to get quick stats
export function getQuickStats(): QuickStat[] {
  return [...quickStats];
}

// Helper function to get upcoming departures
export function getUpcomingDepartures(limit?: number): TripSchedule[] {
  const departures = [...upcomingDepartures];
  return limit ? departures.slice(0, limit) : departures;
}

// Helper function to get recent trips
export function getRecentTrips(limit?: number): TripSchedule[] {
  const trips = [...recentTrips];
  return limit ? trips.slice(0, limit) : trips;
}
