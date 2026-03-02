'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TripManagementService,
  TripResponse,
  PageTripResponse,
  TripStatisticsResponse,
  TripFilterOptionsResponse,
} from '../../../../generated/api-clients/route-management';

// Import our custom components
import { TripStatsCards } from '@/components/mot/trips/TripStatsCards';
import TripAdvancedFilters from '@/components/mot/trips/TripAdvancedFilters';
import { TripActionButtons } from '@/components/mot/trips/TripActionButtons';
import { TripsTable } from '@/components/mot/trips/TripsTable';

// Import shared UI components
import { DataPagination } from '@/components/shared/DataPagination';
import { DeleteConfirmationModal } from '@/components/mot/confirmation-modals';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  status?:
    | 'pending'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'delayed'
    | 'in_transit'
    | 'boarding'
    | 'departed';
  routeId?: string;
  operatorId?: string;
  scheduleId?: string;
  busId?: string;
  passengerServicePermitId?: string;
  fromDate?: string;
  toDate?: string;
  hasPsp?: boolean;
  hasBus?: boolean;
  hasDriver?: boolean;
  hasConductor?: boolean;
}

interface FilterOptions {
  statuses: Array<
    | 'pending'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'delayed'
    | 'in_transit'
    | 'boarding'
    | 'departed'
  >;
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
  operators: Array<{ id: string; name: string }>;
  schedules: Array<{ id: string; name: string }>;
  buses: Array<{ id: string; registrationNumber: string }>;
  passengerServicePermits: Array<{ id: string; permitNumber: string }>;
}

export default function TripsPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Trips',
    description: 'Manage and monitor bus trips, assignments, and schedules',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [pspFilter, setPspFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hasPsp, setHasPsp] = useState(false);
  const [hasBus, setHasBus] = useState(false);
  const [hasDriver, setHasDriver] = useState(false);
  const [hasConductor, setHasConductor] = useState(false);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    routes: [],
    operators: [],
    schedules: [],
    buses: [],
    passengerServicePermits: [],
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'tripDate',
    sortDir: 'desc',
    search: '',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalTrips: { count: 0 },
    activeTrips: { count: 0 },
    completedTrips: { count: 0 },
    pendingTrips: { count: 0 },
    cancelledTrips: { count: 0 },
    tripsWithPsp: { count: 0 },
    tripsWithBus: { count: 0 },
    inTransitTrips: { count: 0 },
  });

  // State for modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<TripResponse | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const response: TripFilterOptionsResponse =
        await TripManagementService.getTripFilterOptions();

      setFilterOptions({
        statuses: (response.statuses as any) || [],
        routes:
          response.routes?.map((route) => ({
            id: route.id || '',
            name: route.name || '',
            routeGroup: route.routeGroupName,
          })) || [],
        operators:
          response.operators?.map((op) => ({
            id: op.id || '',
            name: op.name || '',
          })) || [],
        schedules:
          response.schedules?.map((schedule) => ({
            id: schedule.id || '',
            name: schedule.name || '',
          })) || [],
        buses:
          response.buses?.map((bus) => ({
            id: bus.id || '',
            registrationNumber: bus.plateNumber || '',
          })) || [],
        passengerServicePermits:
          response.passengerServicePermits?.map((psp) => ({
            id: psp.id || '',
            permitNumber: psp.permitNumber || '',
          })) || [],
      });
    } catch (err) {
      console.error('Failed to load filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response: TripStatisticsResponse =
        await TripManagementService.getTripStatistics();

      setStats({
        totalTrips: { count: response.totalTrips || 0 },
        activeTrips: { count: response.activeTrips || 0 },
        completedTrips: { count: response.completedTrips || 0 },
        pendingTrips: { count: response.pendingTrips || 0 },
        cancelledTrips: { count: response.cancelledTrips || 0 },
        tripsWithPsp: { count: response.tripsWithAssignedPsp || 0 },
        tripsWithBus: { count: response.tripsWithAssignedBus || 0 },
        inTransitTrips: { count: response.inTransitTrips || 0 },
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Load trips from API
  const loadTrips = useCallback(async () => {
    try {
      setError(null);

      const response: PageTripResponse =
        await TripManagementService.getAllTrips(
          queryParams.page,
          queryParams.size,
          queryParams.sortBy,
          queryParams.sortDir,
          queryParams.search || undefined,
          queryParams.status,
          queryParams.routeId,
          queryParams.operatorId,
          queryParams.scheduleId,
          queryParams.passengerServicePermitId,
          queryParams.busId,
          queryParams.fromDate,
          queryParams.toDate,
          queryParams.hasPsp,
          queryParams.hasBus,
          queryParams.hasDriver,
          queryParams.hasConductor
        );

      setTrips(response.content || []);
      setPagination({
        currentPage: response.pageable?.pageNumber || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageSize: response.pageable?.pageSize || 10,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load trips');
      console.error('Failed to load trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Update query params with filters (optimized to prevent unnecessary updates)
  const updateQueryParams = useCallback(
    (updates: Partial<QueryParams>) => {
      setQueryParams((prev) => {
        const newParams = { ...prev, ...updates };

        // Apply filter states to query params
        if (statusFilter !== 'all') {
          newParams.status = statusFilter as any;
        } else {
          delete newParams.status;
        }

        if (routeFilter !== 'all') {
          newParams.routeId = routeFilter;
        } else {
          delete newParams.routeId;
        }

        if (operatorFilter !== 'all') {
          newParams.operatorId = operatorFilter;
        } else {
          delete newParams.operatorId;
        }

        if (scheduleFilter !== 'all') {
          newParams.scheduleId = scheduleFilter;
        } else {
          delete newParams.scheduleId;
        }

        if (busFilter !== 'all') {
          newParams.busId = busFilter;
        } else {
          delete newParams.busId;
        }

        if (pspFilter !== 'all') {
          newParams.passengerServicePermitId = pspFilter;
        } else {
          delete newParams.passengerServicePermitId;
        }

        if (fromDate) {
          newParams.fromDate = fromDate;
        } else {
          delete newParams.fromDate;
        }

        if (toDate) {
          newParams.toDate = toDate;
        } else {
          delete newParams.toDate;
        }

        if (hasPsp) {
          newParams.hasPsp = hasPsp;
        } else {
          delete newParams.hasPsp;
        }

        if (hasBus) {
          newParams.hasBus = hasBus;
        } else {
          delete newParams.hasBus;
        }

        if (hasDriver) {
          newParams.hasDriver = hasDriver;
        } else {
          delete newParams.hasDriver;
        }

        if (hasConductor) {
          newParams.hasConductor = hasConductor;
        } else {
          delete newParams.hasConductor;
        }

        return newParams;
      });
    },
    [
      statusFilter,
      routeFilter,
      operatorFilter,
      scheduleFilter,
      busFilter,
      pspFilter,
      fromDate,
      toDate,
      hasPsp,
      hasBus,
      hasDriver,
      hasConductor,
    ]
  );

  // Apply filters when they change (with debounce for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParams({ page: 0 });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    statusFilter,
    routeFilter,
    operatorFilter,
    scheduleFilter,
    busFilter,
    pspFilter,
    fromDate,
    toDate,
    hasPsp,
    hasBus,
    hasDriver,
    hasConductor,
    updateQueryParams,
  ]);

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    updateQueryParams({ search: searchTerm, page: 0 });
  };

  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    updateQueryParams({ sortBy, sortDir, page: 0 });
  };

  const handlePageChange = (page: number) => {
    updateQueryParams({ page });
  };

  const handlePageSizeChange = (size: number) => {
    updateQueryParams({ size, page: 0 });
  };

  const handleClearAllFilters = useCallback(() => {
    // Clear all filter states
    setSearchTerm('');
    setStatusFilter('all');
    setRouteFilter('all');
    setOperatorFilter('all');
    setScheduleFilter('all');
    setBusFilter('all');
    setPspFilter('all');
    setFromDate('');
    setToDate('');
    setHasPsp(false);
    setHasBus(false);
    setHasDriver(false);
    setHasConductor(false);

    // Update query params to clear everything
    setQueryParams({
      page: 0,
      size: queryParams.size,
      sortBy: 'tripDate',
      sortDir: 'desc',
      search: '',
    });
  }, [queryParams.size]);

  // Trip action handlers
  const handleAddNewTrip = () => {
    router.push('/mot/trips/add');
  };

  const handleGenerateTrips = () => {
    router.push('/mot/trips/assignment');
  };

  const handleExportAll = async () => {
    try {
      // Implementation would depend on your export API
      console.log('Exporting all trips...');
      // Example: await TripManagementService.exportTrips();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleView = (tripId: string) => {
    router.push(`/mot/trips/${tripId}`);
  };

  const handleEdit = (tripId: string) => {
    router.push(`/mot/trips/${tripId}/edit`);
  };

  const handleStart = async (tripId: string) => {
    try {
      await TripManagementService.startTrip(tripId);
      loadTrips(); // Reload data
      loadStatistics(); // Update stats
    } catch (err) {
      console.error('Failed to start trip:', err);
    }
  };

  const handleComplete = async (tripId: string) => {
    try {
      await TripManagementService.completeTrip(tripId);
      loadTrips(); // Reload data
      loadStatistics(); // Update stats
    } catch (err) {
      console.error('Failed to complete trip:', err);
    }
  };

  const handleCancel = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      setTripToCancel(trip);
      setShowCancelModal(true);
    }
  };

  const handleCancelConfirm = async () => {
    if (!tripToCancel) return;

    try {
      setIsCancelling(true);
      await TripManagementService.cancelTrip(
        tripToCancel.id || '',
        cancelReason || 'Cancelled by user'
      );
      loadTrips(); // Reload data
      loadStatistics(); // Update stats
      setShowCancelModal(false);
      setTripToCancel(null);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel trip:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelCancel = () => {
    setShowCancelModal(false);
    setTripToCancel(null);
    setCancelReason('');
  };

  const handleAssignPsp = (tripId: string) => {
    router.push(`/mot/trips/${tripId}/assign-psp`);
  };

  const handleDelete = (tripId: string, _tripName: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      setTripToDelete(trip);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTripToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;

    try {
      setIsDeleting(true);
      await TripManagementService.deleteTrip(tripToDelete.id || '');
      loadTrips(); // Reload data
      loadStatistics(); // Update stats
      setShowDeleteModal(false);
      setTripToDelete(null);
    } catch (err) {
      console.error('Failed to delete trip:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useSetPageActions(
    <TripActionButtons
      onAddTrip={handleAddNewTrip}
      onGenerateTrips={handleGenerateTrips}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />
  );

  if (isLoading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading trips...</p>
        </div>
      </div>
    );
  }

  if (error && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">Failed to load trips</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              loadTrips();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <TripStatsCards stats={stats} />

        {/* Filters */}
        <TripAdvancedFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          routeFilter={routeFilter}
          setRouteFilter={setRouteFilter}
          operatorFilter={operatorFilter}
          setOperatorFilter={setOperatorFilter}
          scheduleFilter={scheduleFilter}
          setScheduleFilter={setScheduleFilter}
          busFilter={busFilter}
          setBusFilter={setBusFilter}
          pspFilter={pspFilter}
          setPspFilter={setPspFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          hasPsp={hasPsp}
          setHasPsp={setHasPsp}
          hasBus={hasBus}
          setHasBus={setHasBus}
          hasDriver={hasDriver}
          setHasDriver={setHasDriver}
          hasConductor={hasConductor}
          setHasConductor={setHasConductor}
          filterOptions={filterOptions}
          loading={filterOptionsLoading}
          totalCount={pagination.totalElements}
          filteredCount={pagination.totalElements}
          onClearAll={handleClearAllFilters}
          onSearch={handleSearch}
        />

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          {/* Trips Table */}
          <TripsTable
            trips={trips}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStart={handleStart}
            onComplete={handleComplete}
            onCancel={handleCancel}
            onAssignPsp={handleAssignPsp}
            onSort={handleSort}
            activeFilters={{}}
            loading={isLoading}
            currentSort={{
              field: queryParams.sortBy,
              direction: queryParams.sortDir,
            }}
          />
          {/* Pagination */}
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={isLoading}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && tripToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Delete Trip"
            itemName={`${tripToDelete.routeName} - ${formatDate(
              tripToDelete.tripDate
            )}`}
            isLoading={isDeleting}
          />
        )}

        {/* Cancel Trip Modal */}
        {showCancelModal && tripToCancel && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cancel Trip
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this trip? Please provide a
                reason:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Cancellation reason (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCancelCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Keep Trip
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Trip'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
