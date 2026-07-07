'use client';

import { RefreshCw } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  OperatorTripStatsCards,
  OperatorTripsFilters,
  OperatorTripsTable,
} from '@/components/operator/trips';
import { useOperatorTripsListing } from '@/hooks/operator/trips/useOperatorTripsListing';

export default function OperatorTripsPage() {
  useSetPageMetadata({
    title: 'My Trips',
    description: 'View and monitor all trips operated by your fleet',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  const {
    trips, stats, filterOptions, isLoading, statsLoading, pagination,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter, routeFilter, setRouteFilter,
    scheduleFilter, setScheduleFilter, busFilter, setBusFilter,
    permitFilter, setPermitFilter, fromDate, setFromDate, toDate, setToDate,
    queryParams, handleSearch, handleSort, handlePageChange,
    handlePageSizeChange, handleView, handleClearAllFilters, handleRefresh,
  } = useOperatorTripsListing();

  const handleSortColumn = (column: string) => {
    const newDir = queryParams.sortBy === column && queryParams.sortDir === 'asc' ? 'desc' : 'asc';
    handleSort(column, newDir);
  };

  useSetPageActions(
    <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </button>,
  );

  return (
    <div className="space-y-6">
      <OperatorTripStatsCards stats={stats} loading={statsLoading} />

      <OperatorTripsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        scheduleFilter={scheduleFilter}
        setScheduleFilter={setScheduleFilter}
        busFilter={busFilter}
        setBusFilter={setBusFilter}
        permitFilter={permitFilter}
        setPermitFilter={setPermitFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        filterOptions={filterOptions}
        loading={false}
        totalCount={pagination.totalElements}
        filteredCount={pagination.totalElements}
        onClearAll={handleClearAllFilters}
        onSearch={handleSearch}
      />

      <OperatorTripsTable
          trips={trips}
          onView={handleView}
          onSort={handleSortColumn}
          loading={isLoading}
          sortColumn={queryParams.sortBy}
          sortDirection={queryParams.sortDir}
          totalItems={pagination.totalElements}
          page={pagination.currentPage + 1}
          pageSize={pagination.pageSize}
          onPageChange={(p) => handlePageChange(p - 1)}
          onPageSizeChange={handlePageSizeChange}
        />
    </div>
  );
}

