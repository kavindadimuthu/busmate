import { useState, useEffect, useCallback } from 'react';
import { usePageContext } from '@/context/PageContext';
import {
  getTripStats,
  getTrips,
  getTripById,
  updateTripStatus,
  recordTripDeparture,
  getAssignedStop,
} from '@/data/timekeeper';
import {
  TripStats,
  Trip,
  TripStatus,
  AssignedStop,
} from '@/data/timekeeper/types';

export function useTimeKeeperTrips() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [assignedStop, setAssignedStop] = useState<AssignedStop | null>(null);
  const [stats, setStats] = useState<TripStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { setMetadata } = usePageContext();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const stop = getAssignedStop();
      setAssignedStop(stop);

      const tripStats = getTripStats(selectedDate);
      setStats(tripStats);

      const tripsData = getTrips({ date: selectedDate }, 0, 50);
      setTrips(tripsData.content);
    } catch (error) {
      console.error('Failed to load trips data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Manage trips for ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  const handleViewTrip = useCallback((tripId: string) => {
    const trip = getTripById(tripId);
    if (trip) {
      setSelectedTrip(trip);
      setIsModalOpen(true);
    }
  }, []);

  const handleStartBoarding = useCallback(
    (tripId: string) => {
      const updated = updateTripStatus(tripId, 'boarding');
      if (updated) {
        loadData();
        if (selectedTrip?.id === tripId) setSelectedTrip(updated);
      }
    },
    [loadData, selectedTrip]
  );

  const handleRecordDeparture = useCallback(
    (tripId: string, passengerCount?: number) => {
      const updated = recordTripDeparture(tripId, passengerCount);
      if (updated) {
        loadData();
        if (selectedTrip?.id === tripId) setSelectedTrip(updated);
      }
    },
    [loadData, selectedTrip]
  );

  const handleUpdateStatus = useCallback(
    (tripId: string, status: TripStatus) => {
      const updated = updateTripStatus(tripId, status);
      if (updated) {
        loadData();
        if (selectedTrip?.id === tripId) setSelectedTrip(updated);
      }
    },
    [loadData, selectedTrip]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    isLoading,
    stats,
    trips,
    selectedTrip,
    isModalOpen,
    loadData,
    handleViewTrip,
    handleStartBoarding,
    handleRecordDeparture,
    handleUpdateStatus,
    handleCloseModal,
  };
}
