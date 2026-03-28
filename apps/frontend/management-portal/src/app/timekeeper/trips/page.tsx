'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Button, Input } from '@busmate/ui';
import { Calendar, RefreshCw } from 'lucide-react';
import { TripStatsCards, TripsTable, TripDetailModal } from '@/components/timekeeper/trips';
import { useTimeKeeperTrips } from '@/hooks/timekeeper/trips/useTimeKeeperTrips';
import { availableRoutes } from '@/data/timekeeper';

export default function TimeKeeperTripsPage() {
  const {
    selectedDate, setSelectedDate, isLoading, stats, trips,
    selectedTrip, isModalOpen, loadData,
    handleViewTrip, handleStartBoarding, handleRecordDeparture,
    handleUpdateStatus, handleCloseModal,
  } = useTimeKeeperTrips();

  useSetPageMetadata({
    title: 'Trip Management',
    description: 'Manage trips for your assigned stop',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  useSetPageActions(
    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)} className="w-auto"
          />
        </div>
      </div>

      {stats && <TripStatsCards stats={stats} />}

      <TripsTable
        trips={trips}
        routes={availableRoutes.map(r => ({ id: r.id, name: r.name, number: r.number }))}
        onViewTrip={handleViewTrip} onStartBoarding={handleStartBoarding}
        onRecordDeparture={handleRecordDeparture} onUpdateStatus={handleUpdateStatus}
      />

      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip} isOpen={isModalOpen} onClose={handleCloseModal}
          onStartBoarding={handleStartBoarding} onRecordDeparture={handleRecordDeparture}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
