'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TripManagementService,
  TripResponse,
  PageTripResponse,
  TripStatisticsResponse,
  TripFilterOptionsResponse,
} from '@busmate/api-client-route';
import { useDataTable, useDialog } from '@busmate/ui';
import { useToast } from '@/hooks/use-toast';
import type { TripFilters } from './TripsFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: string[];
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
  operators: Array<{ id: string; name: string }>;
  schedules: Array<{ id: string; name: string }>;
  buses: Array<{ id: string; registrationNumber: string }>;
  passengerServicePermits: Array<{ id: string; permitNumber: string }>;
}

// ── Initial state ─────────────────────────────────────────────────

const DEFAULT_FILTERS: TripFilters = {
  status: '__all__',
  routeId: '__all__',
  operatorId: '__all__',
  scheduleId: '__all__',
  busId: '__all__',
  pspId: '__all__',
  fromDate: '',
  toDate: '',
  hasPsp: '__all__',
  hasBus: '__all__',
  hasDriver: '__all__',
  hasConductor: '__all__',
};

const INITIAL_STATS = {
  totalTrips: { count: 0 },
  activeTrips: { count: 0 },
  completedTrips: { count: 0 },
  pendingTrips: { count: 0 },
  cancelledTrips: { count: 0 },
  inTransitTrips: { count: 0 },
};

// ── Hook ──────────────────────────────────────────────────────────

export function useTrips() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    state: { searchQuery, sortColumn, sortDirection, page, pageSize, filters },
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
  } = useDataTable<TripFilters>({ initialFilters: DEFAULT_FILTERS });

  // ── Local state ───────────────────────────────────────────────

  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    routes: [],
    operators: [],
    schedules: [],
    buses: [],
    passengerServicePermits: [],
  });

  // Dialogs
  const deleteDialog = useDialog<TripResponse>();
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelDialog = useDialog<TripResponse>();
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Data loaders ──────────────────────────────────────────────

  const loadFilterOptions = useCallback(async () => {
    try {
      const response: TripFilterOptionsResponse =
        await TripManagementService.getTripFilterOptions();

      setFilterOptions({
        statuses: (response.statuses as string[]) || [],
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
    }
  }, []);

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
        inTransitTrips: { count: response.inTransitTrips || 0 },
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const f = filters;
      const statusVal = f.status !== '__all__' ? (f.status as any) : undefined;
      const routeVal = f.routeId !== '__all__' ? f.routeId : undefined;
      const operatorVal = f.operatorId !== '__all__' ? f.operatorId : undefined;
      const scheduleVal = f.scheduleId !== '__all__' ? f.scheduleId : undefined;
      const busVal = f.busId !== '__all__' ? f.busId : undefined;
      const pspVal = f.pspId !== '__all__' ? f.pspId : undefined;
      const fromDateVal = f.fromDate || undefined;
      const toDateVal = f.toDate || undefined;
      const hasPspVal = f.hasPsp !== '__all__' ? f.hasPsp === 'true' : undefined;
      const hasBusVal = f.hasBus !== '__all__' ? f.hasBus === 'true' : undefined;
      const hasDriverVal = f.hasDriver !== '__all__' ? f.hasDriver === 'true' : undefined;
      const hasConductorVal = f.hasConductor !== '__all__' ? f.hasConductor === 'true' : undefined;

      const response: PageTripResponse =
        await TripManagementService.getAllTrips(
          page - 1,
          pageSize,
          sortColumn || 'tripDate',
          sortDirection || 'desc',
          searchQuery || undefined,
          statusVal,
          routeVal,
          operatorVal,
          scheduleVal,
          pspVal,
          busVal,
          fromDateVal,
          toDateVal,
          hasPspVal,
          hasBusVal,
          hasDriverVal,
          hasConductorVal,
        );

      setTrips(response.content || []);
      setTotalItems(response.totalElements || 0);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to load trips', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchQuery, filters, toast]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // ── Action handlers ───────────────────────────────────────────

  const handleView = useCallback(
    (id: string) => router.push(`/mot/trips/${id}`),
    [router],
  );

  const handleStart = useCallback(async (tripId: string) => {
    try {
      await TripManagementService.startTrip(tripId);
      loadTrips();
      loadStatistics();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to start trip', variant: 'destructive' });
    }
  }, [loadTrips, loadStatistics, toast]);

  const handleComplete = useCallback(async (tripId: string) => {
    try {
      await TripManagementService.completeTrip(tripId);
      loadTrips();
      loadStatistics();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to complete trip', variant: 'destructive' });
    }
  }, [loadTrips, loadStatistics, toast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.data) return;
    try {
      setIsDeleting(true);
      await TripManagementService.deleteTrip(deleteDialog.data.id || '');
      loadTrips();
      loadStatistics();
      deleteDialog.close();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete trip', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, loadTrips, loadStatistics, toast]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelDialog.data) return;
    try {
      setIsCancelling(true);
      await TripManagementService.cancelTrip(
        cancelDialog.data.id || '',
        cancelReason || 'Cancelled by user',
      );
      loadTrips();
      loadStatistics();
      cancelDialog.close();
      setCancelReason('');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to cancel trip', variant: 'destructive' });
    } finally {
      setIsCancelling(false);
    }
  }, [cancelDialog, cancelReason, loadTrips, loadStatistics, toast]);

  const handleExportAll = useCallback(async () => {
    try {
      console.log('Exporting all trips...');
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  // ── Active filter count ───────────────────────────────────────

  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => {
      if (key === 'fromDate' || key === 'toDate') return !!val;
      return val !== '__all__';
    },
  ).length;

  return {
    // Table state
    trips,
    totalItems,
    isLoading,
    searchQuery,
    sortColumn,
    sortDirection,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,

    // Stats / filter options
    stats,
    filterOptions,
    activeFilterCount,

    // Dialogs
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    cancelDialog,
    cancelReason,
    setCancelReason,
    isCancelling,
    handleCancelConfirm,

    // Actions
    handleView,
    handleStart,
    handleComplete,
    handleExportAll,
  };
}
