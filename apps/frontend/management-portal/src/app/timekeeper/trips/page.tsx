'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions, usePageContext } from '@/context/PageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  TripStatsCards,
  TripsTable,
  TripDetailModal,
} from '@/components/timekeeper/trips';
import {
  getTripStats,
  getTrips,
  getTripById,
  updateTripStatus,
  recordTripDeparture,
  availableRoutes,
  getAssignedStop,
} from '@/data/timekeeper';
import { 
  TripStats, 
  Trip, 
  TripStatus,
  AssignedStop,
} from '@/data/timekeeper/types';

export default function TimeKeeperTripsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [assignedStop, setAssignedStop] = useState<AssignedStop | null>(null);

  useSetPageMetadata({
    title: 'Trip Management',
    description: 'Manage trips for your assigned stop',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  const { setMetadata } = usePageContext();

  // Trip state
  const [stats, setStats] = useState<TripStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Modal state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get assigned stop
      const stop = getAssignedStop();
      setAssignedStop(stop);

      // Load trip stats
      const tripStats = getTripStats(selectedDate);
      setStats(tripStats);

      // Load trips
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

  // Update header description once assigned stop is known
  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Manage trips for ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  // Refresh action in the content header
  useSetPageActions(
    <Button
      variant="outline"
      size="sm"
      onClick={loadData}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  // Trip actions
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
        // Close modal if open
        if (selectedTrip?.id === tripId) {
          setSelectedTrip(updated);
        }
      }
    },
    [loadData, selectedTrip]
  );

  const handleRecordDeparture = useCallback(
    (tripId: string, passengerCount?: number) => {
      const updated = recordTripDeparture(tripId, passengerCount);
      if (updated) {
        loadData();
        // Close modal if open
        if (selectedTrip?.id === tripId) {
          setSelectedTrip(updated);
        }
      }
    },
    [loadData, selectedTrip]
  );

  const handleUpdateStatus = useCallback(
    (tripId: string, status: TripStatus) => {
      const updated = updateTripStatus(tripId, status);
      if (updated) {
        loadData();
        // Update modal if open
        if (selectedTrip?.id === tripId) {
          setSelectedTrip(updated);
        }
      }
    },
    [loadData, selectedTrip]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

        {/* Stats Cards */}
        {stats && <TripStatsCards stats={stats} />}

        {/* Trips Table */}
        <TripsTable
          trips={trips}
          routes={availableRoutes.map(r => ({ id: r.id, name: r.name, number: r.number }))}
          onViewTrip={handleViewTrip}
          onStartBoarding={handleStartBoarding}
          onRecordDeparture={handleRecordDeparture}
          onUpdateStatus={handleUpdateStatus}
        />

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStartBoarding={handleStartBoarding}
          onRecordDeparture={handleRecordDeparture}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
