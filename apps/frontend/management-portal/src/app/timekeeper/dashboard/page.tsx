'use client';

import { useState, useEffect } from 'react';
import { useSetPageMetadata, usePageContext } from '@/context/PageContext';
import {
  RealTimeClock,
  StatsCards,
  UpcomingDepartures,
  AssignedStopInfo,
} from '@/components/timekeeper/dashboard';
import {
  getDashboardStats,
  getUpcomingDepartures,
  getAssignedStop,
} from '@/data/timekeeper';
import { 
  DashboardStats, 
  TripSchedule, 
  AssignedStop 
} from '@/data/timekeeper/types';

export default function TimeKeeperDashboardPage() {
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
    // Simulate API loading
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In production, these would be API calls
        const dashboardStats = getDashboardStats();
        const upcomingDepartures = getUpcomingDepartures(5);
        const stopInfo = getAssignedStop();
        
        setStats(dashboardStats);
        setDepartures(upcomingDepartures);
        setAssignedStop(stopInfo);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update header description once assigned stop is known
  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Assigned Stop: ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  if (isLoading || !stats || !assignedStop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Clock and Assigned Stop Info */}
        <div className="space-y-6">
          {/* Real-time Clock */}
          <RealTimeClock />

          {/* Assigned Stop Info */}
          <AssignedStopInfo 
            stop={assignedStop} 
            busesAtStop={stats.busesAtStop} 
          />
        </div>

        {/* Right Column - Upcoming Departures (spans 2 columns on large screens) */}
        <div className="lg:col-span-2">
          <UpcomingDepartures 
            departures={departures} 
            title="Upcoming Departures"
          />
        </div>
      </div>
    </div>
  );
}
