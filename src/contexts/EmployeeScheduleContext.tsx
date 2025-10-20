import { useAuth } from '@/hooks/auth/useAuth';
import { employeeApi } from '@/services/api/employee';
import { ConductorTripApiResponse, EmployeeSchedule } from '@/types/employee';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type TimeFilter = 'today' | 'upcoming' | 'past';

interface EmployeeScheduleContextType {
  schedules: EmployeeSchedule[];
  filteredSchedules: EmployeeSchedule[];
  loading: boolean;
  error: string | null;
  activeTab: TimeFilter;
  setActiveTab: (tab: TimeFilter) => void;
  retry: () => void;
  refreshSchedules: () => Promise<void>;
  updateTripStatus: (tripId: string, status: EmployeeSchedule['status']) => void;
}

const EmployeeScheduleContext = createContext<EmployeeScheduleContextType | undefined>(undefined);

// Helper function to determine if a trip is startable based on current time
export function isStartable(schedule: EmployeeSchedule): boolean {
  const now = new Date();
  
  // Parse the date from YYYY-MM-DD format
  const [year, month, day] = schedule.date.split('-').map(Number);
  
  // Parse times from HH:MM:SS format
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);

  // Create Date objects for start and end time
  const startDateTime = new Date(year, month - 1, day, startHour, startMin);
  const endDateTime = new Date(year, month - 1, day, endHour, endMin);
  
  // Allow starting 30 minutes before scheduled start time
  const canStartTime = new Date(startDateTime.getTime() - 30 * 60 * 1000);

  // Trip is startable if current time is within the allowed window (30 minutes before start to trip end time)
  return now >= canStartTime && now <= endDateTime;
}

interface EmployeeScheduleProviderProps {
  children: React.ReactNode;
}

export function EmployeeScheduleProvider({ children }: EmployeeScheduleProviderProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<EmployeeSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<TimeFilter>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manuallyStartedTrips, setManuallyStartedTrips] = useState<Set<string>>(new Set());

  // Fetch schedules from API
  const fetchSchedules = useCallback(async () => {
    if (!user?.id) {
      setError('No user ID found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏠 Fetching schedules for conductor ID:', user.id);
       
      // Fetch schedules using conductor ID (which is user.id)
      const data = await employeeApi.getSchedule(String(user.id));
      console.log(` Fetched ${data.length} schedules`);
      
      // Transform API response to match EmployeeSchedule interface and add status
      const schedulesWithStatus: EmployeeSchedule[] = data.map((item: ConductorTripApiResponse) => {
        const schedule: EmployeeSchedule = {
          id: item.id,
          date: item.tripDate, // API returns tripDate in YYYY-MM-DD format
          startTime: item.scheduledDepartureTime, // API returns HH:MM:SS format
          endTime: item.scheduledArrivalTime, // API returns HH:MM:SS format
          route: item.routeName,
          busId: item.busId, // Using actual busId from API
          status: 'pending', // Will be updated below
          passengers: 0, // Not provided in API, set default
          revenue: 0, // Not provided in API, set default
          // Additional properties for journey details
          fromLocation: item.routeName?.split(' - ')[0] || item.routeName || 'Unknown',
          toLocation: item.routeName?.split(' - ')[1] || 'Unknown',
          busPlateNumber: item.busPlateNumber,
          routeName: item.routeName,
          scheduleName: item.scheduleName,
          scheduleId: item.scheduleId,
          routeGroupId: item.routeGroupId,
          RouteId: item.routeId,
        };
        
        // Use API status if available, otherwise determine based on date/time
        const now = new Date();
        const [year, month, day] = schedule.date.split('-').map(Number);
        const [hour, minute] = schedule.endTime.split(':').map(Number);
        const scheduleEndDateTime = new Date(year, month - 1, day, hour, minute);
        
        if (item.status && ['active', 'ongoing', 'completed', 'cancelled', 'ACTIVE', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(item.status)) {
          // Map backend status to frontend status
          const backendStatus = item.status.toLowerCase();
          if (backendStatus === 'active') {
            schedule.status = 'ongoing'; // Map 'active' to 'ongoing'
          } else {
            schedule.status = backendStatus as EmployeeSchedule['status'];
          }
        } else if (manuallyStartedTrips.has(item.id)) {
          // Keep manually started trips as ongoing until API confirms
          schedule.status = 'ongoing';
        } else if (now > scheduleEndDateTime) {
          // Past trips should be marked as completed
          schedule.status = 'completed';
        } else {
          // Future trips are upcoming
          schedule.status = 'upcoming';
        }
        
        return schedule;
      });
      
      setSchedules(schedulesWithStatus);
      console.log(`🏠 Processed ${schedulesWithStatus.length} schedules with status`);
      
      // Clean up manually started trips that are now confirmed by the API
      setManuallyStartedTrips(prev => {
        const newSet = new Set(prev);
        schedulesWithStatus.forEach(schedule => {
          if (schedule.status === 'ongoing' && prev.has(schedule.id)) {
            // API confirmed the status, remove from manual tracking
            newSet.delete(schedule.id);
          }
        });
        return newSet;
      });
      
    } catch (err) {
      console.error('🏠 Failed to fetch employee schedules:', err);
      setError('Failed to load schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchSchedules();
    }
  }, [user?.id, fetchSchedules]);

  // Filter and sort schedules based on active tab
  useEffect(() => {
    if (schedules.length === 0) {
      setFilteredSchedules([]);
      return;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    // console.log('🏠 Filtering schedules for tab:', activeTab);
    // console.log('🏠 Current date:', today);

    // Helper function to create a proper Date object for sorting
    const getDateTimeForSorting = (schedule: EmployeeSchedule) => {
      // Parse date from YYYY-MM-DD format
      const [year, month, day] = schedule.date.split('-').map(Number);
      
      // Parse time from HH:MM:SS format and handle it properly
      const timeParts = schedule.startTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Create a proper Date object for accurate comparison
      const dateTime = new Date(year, month - 1, day, hours, minutes);
      
      // console.log(`🏠 Parsing ${schedule.route}: ${schedule.date} ${schedule.startTime} -> ${dateTime.toLocaleString()}`);
      return dateTime;
    };

    switch (activeTab) {
      case 'today':
        // Today's schedules sorted by earliest start time first
        const todaySchedules = schedules
          .filter(schedule => {
            const isToday = schedule.date === today;
            // console.log(`🏠 Schedule ${schedule.route}: date=${schedule.date}, isToday=${isToday}`);
            return isToday;
          })
          .sort((a, b) => {
            const dateTimeA = getDateTimeForSorting(a);
            const dateTimeB = getDateTimeForSorting(b);
            const comparison = dateTimeA.getTime() - dateTimeB.getTime();
            return comparison;
          });
        
        // console.log(`🏠 Found ${todaySchedules.length} schedules for today`);
        // console.log('🏠 Today schedules sorted:', todaySchedules.map(s => `${s.date} ${s.startTime} - ${s.route}`));
        setFilteredSchedules(todaySchedules);
        break;
        
      case 'upcoming':
        // Future schedules sorted by earliest start time first
        const upcomingSchedules = schedules
          .filter(schedule => {
            const upcoming = schedule.date > today;
            return upcoming;
          })
          .sort((a, b) => {
            const dateTimeA = getDateTimeForSorting(a);
            const dateTimeB = getDateTimeForSorting(b);
            return dateTimeA.getTime() - dateTimeB.getTime();
          });
        
        // console.log(`🏠 Found ${upcomingSchedules.length} upcoming schedules`);
        // console.log('🏠 Upcoming schedules sorted:', upcomingSchedules.map(s => `${s.date} ${s.startTime} - ${s.route}`));
        setFilteredSchedules(upcomingSchedules);
        break;
        
      case 'past':
        // Completed schedules sorted by latest completed trips first (most recent at top)
        const pastSchedules = schedules
          .filter(schedule => {
            const completed = schedule.date < today;
            return completed;
          })
          .sort((a, b) => {
            const dateTimeA = getDateTimeForSorting(a);
            const dateTimeB = getDateTimeForSorting(b);
            // Reverse order for past schedules (latest first)
            return dateTimeB.getTime() - dateTimeA.getTime();
          });
        
        // console.log(`🏠 Found ${pastSchedules.length} completed schedules`);
        // console.log('🏠 Past schedules sorted:', pastSchedules.map(s => `${s.date} ${s.startTime} - ${s.route}`));
        setFilteredSchedules(pastSchedules);
        break;
        
      default:
        setFilteredSchedules(schedules);
    }
  }, [activeTab, schedules]);

  // Retry function
  const retry = useCallback(() => {
    setError(null);
    fetchSchedules();
  }, [fetchSchedules]);

  // Refresh function that can be called from any component
  const refreshSchedules = useCallback(async () => {
    await fetchSchedules();
  }, [fetchSchedules]);

  // Function to immediately update a trip's status (for instant UI feedback)
  const updateTripStatus = useCallback((tripId: string, status: EmployeeSchedule['status']) => {
    // If setting to ongoing, mark as manually started
    if (status === 'ongoing') {
      setManuallyStartedTrips(prev => new Set([...prev, tripId]));
    }
    
    setSchedules(prevSchedules => 
      prevSchedules.map(schedule => 
        schedule.id === tripId 
          ? { ...schedule, status }
          : schedule
      )
    );
  }, []);

  const value: EmployeeScheduleContextType = {
    schedules,
    filteredSchedules,
    loading,
    error,
    activeTab,
    setActiveTab,
    retry,
    refreshSchedules,
    updateTripStatus,
  };

  return (
    <EmployeeScheduleContext.Provider value={value}>
      {children}
    </EmployeeScheduleContext.Provider>
  );
}

export function useEmployeeScheduleContext(): EmployeeScheduleContextType {
  const context = useContext(EmployeeScheduleContext);
  if (context === undefined) {
    throw new Error('useEmployeeScheduleContext must be used within an EmployeeScheduleProvider');
  }
  return context;
}
