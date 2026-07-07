import { useEmployeeScheduleContext } from '@/contexts/EmployeeScheduleContext';

// Simplified hook to get next trip for home screen
export function useNextTrip() {
  const { schedules, loading } = useEmployeeScheduleContext();
  
  // Find the absolute next upcoming trip (regardless of date)
  const getNextTrip = () => {
    if (!schedules || schedules.length === 0) return null;
    
    const now = new Date();
    
    // Filter all upcoming trips (not completed)
    const upcomingTrips = schedules.filter(schedule => {
      // Parse date and time to create full datetime
      const [year, month, day] = schedule.date.split('-').map(Number);
      const [hour, min] = schedule.startTime.split(':').map(Number);
      const tripDateTime = new Date(year, month - 1, day, hour, min);
      
      // Only include trips that haven't started yet
      return tripDateTime > now;
    });
    
    if (upcomingTrips.length === 0) return null;
    
    // Sort by date and time to get the earliest upcoming trip
    const sortedTrips = upcomingTrips.sort((a, b) => {
      const [yearA, monthA, dayA] = a.date.split('-').map(Number);
      const [hourA, minA] = a.startTime.split(':').map(Number);
      const dateTimeA = new Date(yearA, monthA - 1, dayA, hourA, minA);
      
      const [yearB, monthB, dayB] = b.date.split('-').map(Number);
      const [hourB, minB] = b.startTime.split(':').map(Number);
      const dateTimeB = new Date(yearB, monthB - 1, dayB, hourB, minB);
      
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
    
    return sortedTrips[0];
  };

  const nextTrip = getNextTrip();
  
  // Determine which tab the next trip belongs to
  const getNextTripTab = () => {
    if (!nextTrip) return 'today';
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return nextTrip.date === today ? 'today' : 'upcoming';
  };

  const nextTripTab = getNextTripTab();

  return {
    nextTrip,
    nextTripTab,
    loading,
  };
}

// Helper function to format time from HH:MM:SS to readable format
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [hour, min] = timeStr.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(min));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return timeStr;
  }
}

// Helper function to format date from YYYY-MM-DD to readable format
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-LK', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateStr;
  }
}
