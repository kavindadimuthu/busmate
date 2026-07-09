import { isStartable, useEmployeeScheduleContext } from '@/contexts/EmployeeScheduleContext';
import { useTicket } from '@/contexts/TicketContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { employeeApi } from '@/services/api/employee';
import { EmployeeSchedule } from '@/types/employee';
import { useState } from 'react';

export function useOngoingTrip() {
  const { schedules, refreshSchedules, updateTripStatus } = useEmployeeScheduleContext();
  const { clearRouteStopsCache } = useTicket();
  const { user } = useAuth();
  const [startingTrip, setStartingTrip] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);

  // Find ongoing trip
  const getOngoingTrip = (): EmployeeSchedule | null => {
    if (!schedules || schedules.length === 0) return null;
    
    // Find trip that has status 'ongoing'
    const ongoingTrip = schedules.find(schedule => schedule.status === 'ongoing');
    
    return ongoingTrip || null;
  };

  // Find next upcoming trip that can be started
  const getStartableTrip = (): EmployeeSchedule | null => {
    if (!schedules || schedules.length === 0) return null;
    
    // Find upcoming trips that are startable
    const startableTrips = schedules.filter(schedule => {
      return (schedule.status === 'upcoming' || schedule.status === 'pending') && isStartable(schedule);
    });
    
    if (startableTrips.length === 0) return null;
    
    // Sort by start time and return the earliest
    const sortedTrips = startableTrips.sort((a, b) => {
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

  // Start a trip
  const startTrip = async (tripId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      setStartingTrip(true);

      // Make the API call to start the trip first
      await employeeApi.startTrip(String(user.id), tripId);
      
      // Then update the trip status in context for UI feedback
      updateTripStatus(tripId, 'ongoing');
      
      // Don't refresh immediately to avoid overwriting our status change
      // The status will be confirmed on next natural refresh
      
      return true;
    } catch (error) {
      console.error('Failed to start trip:', error);
      return false;
    } finally {
      setStartingTrip(false);
    }
  };

  // End a trip
  const endTrip = async (tripId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      setEndingTrip(true);

      // Make the API call to end the trip first
      await employeeApi.endTrip(String(user.id), tripId);
      
      // Then update the trip status in context for UI feedback
      updateTripStatus(tripId, 'completed');
      
      return true;
    } catch (error) {
      console.error('Failed to end trip:', error);
      return false;
    } finally {
      setEndingTrip(false);
    }
  };

  const ongoingTrip = getOngoingTrip();
  const startableTrip = getStartableTrip();

  // Refresh trips data
  const refreshTrips = async () => {
    const currentOngoingTrip = getOngoingTrip();
    await refreshSchedules();
    const newOngoingTrip = getOngoingTrip();
    
    // If the ongoing trip has changed (ended or different trip), clear route stops cache
    if (currentOngoingTrip?.id !== newOngoingTrip?.id) {
      console.log('Ongoing trip changed, clearing route stops cache');
      clearRouteStopsCache();
    }
  };

  // Debug: Log bus information when ongoing trip changes
  if (ongoingTrip) {
    console.log('🚌 Ongoing trip bus info:', {
      tripId: ongoingTrip.id,
      busId: ongoingTrip.busId, // Used for database operations
      busPlateNumber: ongoingTrip.busPlateNumber, // Used for UI display
      route: ongoingTrip.route
    });
  }

  return {
    ongoingTrip,
    startableTrip,
    startTrip,
    startingTrip,
    endTrip,
    endingTrip,
    refreshTrips,
  };
}
