'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';

import { TripsStatsCardsNew } from '@/components/mot/trips/trips-stats-cards';
import { TripsFilterBar } from '@/components/mot/trips/trips-filter-bar';
import { TripsTableNew } from '@/components/mot/trips/trips-table';
import { TripActionButtons } from '@/components/mot/trips/TripActionButtons';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useTrips } from '@/components/mot/trips/useTrips';

export default function TripsPage() {
  const router = useRouter();

  const {
    trips, totalItems, isLoading, searchQuery, sortColumn, sortDirection, page, pageSize,
    filters, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters, stats,
    filterOptions, activeFilterCount, deleteDialog, isDeleting, handleDeleteConfirm,
    cancelDialog, isCancelling, handleCancelConfirm, handleView, handleExportAll,
  } = useTrips();

  useSetPageMetadata({
    title: 'Trips',
    description: 'Manage and monitor bus trips, assignments, and schedules',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  useSetPageActions(
    <TripActionButtons
      onAddTrip={() => router.push('/mot/trips/add')}
      onGenerateTrips={() => router.push('/mot/trips/assignment')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <TripsStatsCardsNew stats={stats} />

      <TripsFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <TripsTableNew
        data={trips}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={setSort}
        onView={handleView}
        onDelete={(id) => {
          const trip = trips.find((t) => t.id === id);
          if (trip) deleteDialog.open(trip);
        }}
        hasActiveFilters={activeFilterCount > 0}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Trip"
        description={`Are you sure you want to delete the trip "${deleteDialog.data?.routeName}" on ${deleteDialog.data?.tripDate ? new Date(deleteDialog.data.tripDate).toLocaleDateString() : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      <ConfirmDialog
        open={cancelDialog.isOpen}
        onOpenChange={cancelDialog.setOpen}
        title="Cancel Trip"
        description="Are you sure you want to cancel this trip?"
        confirmLabel={isCancelling ? 'Cancelling...' : 'Cancel Trip'}
        variant="destructive"
        onConfirm={handleCancelConfirm}
        loading={isCancelling}
      />
    </div>
  );
}
