import { useState, useEffect } from 'react';
import { useSetPageMetadata, usePageContext } from '@/context/PageContext';
import {
  getDashboardStats,
  getUpcomingDepartures,
  getAssignedStop,
} from '@/data/timekeeper';
import type {
  DashboardStats,
  TripSchedule,
  AssignedStop,
} from '@/data/timekeeper/types';

export function useTKDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departures, setDepartures] = useState<TripSchedule[]>([]);
  const [assignedStop, setAssignedStop] = useState<AssignedStop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useSetPageMetadata({
    title: 'Dashboard',
    description: 'Real-time overview of trips, attendance, and your assigned stop',
    activeItem: 'dashboard',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Dashboard' }],
  });

  const { setMetadata } = usePageContext();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        setStats(getDashboardStats());
        setDepartures(getUpcomingDepartures(5));
        setAssignedStop(getAssignedStop());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Assigned Stop: ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  return { stats, departures, assignedStop, isLoading };
}
