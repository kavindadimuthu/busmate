'use client';

import { useRouter } from 'next/navigation';
import type { StopResponse } from '@busmate/api-client-route';
import { ConfirmDialog } from '@busmate/ui';

import { BusStopsStatsCards } from '@/components/mot/bus-stops/BusStopsStatsCards';
import { BusStopsFilterBar } from '@/components/mot/bus-stops/BusStopsFilterBar';
import { BusStopsTable } from '@/components/mot/bus-stops/BusStopsTable';
import { BusStopsMapView } from '@/components/mot/bus-stops/BusStopsMapView';
import { ViewTabs } from '@/components/mot/bus-stops/ViewTabs';
import { BusStopActionButtons } from '@/components/mot/bus-stops/BusStopActionButtons';
import { useBusStops } from '@/components/mot/bus-stops/useBusStops';
import { useSetPageActions, useSetPageMetadata } from '@/context/PageContext';

export default function BusStopsPage() {
  const router = useRouter();

  const {
    currentView, setCurrentView, state, setPage, setPageSize, setSort, setSearch,
    setFilters, clearFilters, filteredTableData, isLoading, stats, filterOptions,
    activeFilterCount, deleteDialog, isDeleting, handleDeleteConfirm, handleView, handleEdit,
  } = useBusStops();

  useSetPageMetadata({
    title: 'Bus Stops',
    description: 'Manage and monitor bus stops across your network',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops' }],
  });

  useSetPageActions(
    <BusStopActionButtons
      onAddBusStop={() => router.push('/mot/bus-stops/add-new')}
      onImportBusStops={() => router.push('/mot/bus-stops/import')}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <BusStopsStatsCards stats={stats} />

      <BusStopsFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <ViewTabs activeView={currentView} onViewChange={setCurrentView} />

      {currentView === 'table' ? (
        <BusStopsTable
          data={filteredTableData.data}
          totalItems={filteredTableData.totalItems}
          page={state.page}
          pageSize={state.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          onSort={setSort}
          loading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={deleteDialog.open}
        />
      ) : (
        <BusStopsMapView
          busStops={filteredTableData.data}
          loading={isLoading}
          onDelete={(stop: StopResponse) => deleteDialog.open(stop)}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Bus Stop"
        description={`Are you sure you want to delete "${deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}