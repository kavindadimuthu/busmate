'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BusManagementService,
  type BusResponse,
  type PageBusResponse,
} from '@busmate/api-client-route';
import { useDataTable, useDialog } from '@busmate/ui';
import { useToast } from '@/hooks/use-toast';
import type { BusFilters } from './BusesFilterBar';

// ── Initial state ─────────────────────────────────────────────────

const INITIAL_FILTERS: BusFilters = {
  status: '__all__',
  operatorId: '__all__',
  model: '__all__',
};

const INITIAL_STATS = {
  totalBuses: { count: 0 },
  activeBuses: { count: 0 },
  inactiveBuses: { count: 0 },
  totalOperators: { count: 0 },
  averageCapacity: { count: 0 },
  totalCapacity: { count: 0 },
};

// ── Hook ──────────────────────────────────────────────────────────

export function useBuses() {
  const router = useRouter();
  const { toast } = useToast();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<BusFilters>({
      initialPageSize: 10,
      initialSort: { column: 'ntcRegistrationNumber', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<BusResponse>();

  // ── Local state ───────────────────────────────────────────────

  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[];
    operators: Array<{ id: string; name: string }>;
    models: string[];
  }>({ statuses: [], operators: [], models: [] });

  // ── Statistics loader (reusable after delete) ─────────────────

  const loadStatistics = useCallback(() => {
    BusManagementService.getBusStatistics()
      .then((res) =>
        setStats({
          totalBuses: { count: res.totalBuses || 0 },
          activeBuses: { count: res.activeBuses || 0 },
          inactiveBuses: { count: res.inactiveBuses || 0 },
          totalOperators: {
            count: res.averageBusesPerOperator
              ? Math.round((res.totalBuses || 0) / res.averageBusesPerOperator)
              : 0,
          },
          averageCapacity: { count: res.averageCapacity || 0 },
          totalCapacity: { count: res.totalCapacity || 0 },
        }),
      )
      .catch(console.error);
  }, []);

  // ── Initial load ──────────────────────────────────────────────

  useEffect(() => {
    BusManagementService.getBusFilterOptions()
      .then((res) =>
        setFilterOptions({
          statuses: res.statuses || [],
          operators: (res.operators || [])
            .map((op) => ({ id: op.id || '', name: op.name || '' }))
            .filter((op) => op.id),
          models: res.models || [],
        }),
      )
      .catch(console.error);

    loadStatistics();
  }, [loadStatistics]);

  // ── Data load ─────────────────────────────────────────────────

  const loadBuses = useCallback(async () => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;

    try {
      setIsLoading(true);

      const statusFilter = filters.status !== '__all__' ? (filters.status as any) : undefined;
      const operatorIdFilter = filters.operatorId !== '__all__' ? filters.operatorId : undefined;

      const response: PageBusResponse = await BusManagementService.getAllBuses(
        page - 1,
        pageSize,
        sortColumn ?? 'ntcRegistrationNumber',
        sortDirection,
        searchQuery || undefined,
        operatorIdFilter,
        statusFilter,
      );

      setBuses(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch {
      toast({ title: 'Failed to load buses', variant: 'destructive' });
      setBuses([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [state, toast]);

  useEffect(() => {
    loadBuses();
  }, [
    state.searchQuery,
    state.sortColumn,
    state.sortDirection,
    state.page,
    state.pageSize,
    state.filters.status,
    state.filters.operatorId,
    state.filters.model,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete ────────────────────────────────────────────────────

  const handleDeleteConfirm = useCallback(async () => {
    const bus = deleteDialog.data;
    if (!bus?.id) return;
    try {
      setIsDeleting(true);
      await BusManagementService.deleteBus(bus.id);
      toast({ title: 'Bus Deleted', description: `Bus ${bus.ntcRegistrationNumber} has been deleted.` });
      deleteDialog.close();
      loadBuses();
      loadStatistics();
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete bus.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, loadBuses, loadStatistics, toast]);

  // ── Export ────────────────────────────────────────────────────

  const handleExportAll = useCallback(async () => {
    try {
      const allBusesResponse = await BusManagementService.getAllBusesAsList();
      const allBuses = allBusesResponse || [];

      const headers = ['Registration Number', 'Plate Number', 'Operator', 'Model', 'Capacity', 'Status', 'Created Date'];
      const csvContent = [
        headers.join(','),
        ...allBuses.map((bus) =>
          [
            `"${bus.ntcRegistrationNumber || ''}"`,
            `"${bus.plateNumber || ''}"`,
            `"${bus.operatorName || ''}"`,
            `"${bus.model || ''}"`,
            bus.capacity || 0,
            `"${bus.status || ''}"`,
            `"${bus.createdAt ? new Date(bus.createdAt).toLocaleDateString() : ''}"`,
          ].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buses-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Failed to export buses', variant: 'destructive' });
    }
  }, [toast]);

  // ── Navigation ────────────────────────────────────────────────

  const handleView = useCallback(
    (bus: BusResponse) => router.push(`/mot/buses/${bus.id}`),
    [router],
  );

  const handleEdit = useCallback(
    (bus: BusResponse) => router.push(`/mot/buses/${bus.id}/edit`),
    [router],
  );

  const handleAssignRoute = useCallback(
    (bus: BusResponse) => router.push(`/mot/buses/${bus.id}/assign-route`),
    [router],
  );

  // ── Active filter count ───────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filters.status && state.filters.status !== '__all__') count++;
    if (state.filters.operatorId && state.filters.operatorId !== '__all__') count++;
    if (state.filters.model && state.filters.model !== '__all__') count++;
    return count;
  }, [state.filters]);

  return {
    // Table state
    buses,
    totalElements,
    isLoading,
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,

    // Stats / filters
    stats,
    filterOptions,
    activeFilterCount,

    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,

    // Actions
    handleExportAll,
    handleView,
    handleEdit,
    handleAssignRoute,
  };
}
