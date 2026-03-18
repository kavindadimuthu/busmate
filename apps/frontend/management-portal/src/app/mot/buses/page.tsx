'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BusManagementService,
  type BusResponse,
  type PageBusResponse,
} from '@busmate/api-client-route';
import { useDataTable, useDialog, ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';

import { BusesStatsCardsNew } from '@/components/mot/buses/buses-stats-cards';
import { BusesFilterBar, type BusFilters } from '@/components/mot/buses/buses-filter-bar';
import { BusesTableNew } from '@/components/mot/buses/buses-table';
import { BusActionButtons } from '@/components/mot/buses/BusActionButtons';

const INITIAL_FILTERS: BusFilters = {
  status: '__all__',
  operatorId: '__all__',
  model: '__all__',
};

export default function BusesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<BusFilters>({
      initialPageSize: 10,
      initialSort: { column: 'ntcRegistrationNumber', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<BusResponse>();

  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stats, setStats] = useState({
    totalBuses: { count: 0 },
    activeBuses: { count: 0 },
    inactiveBuses: { count: 0 },
    totalOperators: { count: 0 },
    averageCapacity: { count: 0 },
    totalCapacity: { count: 0 },
  });

  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[];
    operators: Array<{ id: string; name: string }>;
    models: string[];
  }>({ statuses: [], operators: [], models: [] });

  useSetPageMetadata({
    title: 'Buses Management',
    description: 'Manage and monitor bus fleet across all operators',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses' }],
  });

  // ── Export CSV ──────────────────────────────────────────────────
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

  useSetPageActions(
    <BusActionButtons
      onAddBus={() => router.push('/mot/buses/add-new')}
      onImportBuses={() => router.push('/mot/buses/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  // ── Initial load ───────────────────────────────────────────────
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

  // ── Data load ──────────────────────────────────────────────────
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

  // ── Delete ─────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const bus = deleteDialog.data;
    if (!bus?.id) return;
    try {
      setIsDeleting(true);
      await BusManagementService.deleteBus(bus.id);
      toast({ title: 'Bus Deleted', description: `Bus ${bus.ntcRegistrationNumber} has been deleted.` });
      deleteDialog.close();
      loadBuses();
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
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete bus.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filters.status && state.filters.status !== '__all__') count++;
    if (state.filters.operatorId && state.filters.operatorId !== '__all__') count++;
    if (state.filters.model && state.filters.model !== '__all__') count++;
    return count;
  }, [state.filters]);

  return (
    <div className="space-y-6">
      <BusesStatsCardsNew stats={stats} />

      <BusesFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <BusesTableNew
        data={buses}
        totalItems={totalElements}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={isLoading}
        onView={(bus) => router.push(`/mot/buses/${bus.id}`)}
        onEdit={(bus) => router.push(`/mot/buses/${bus.id}/edit`)}
        onDelete={deleteDialog.open}
        onAssignRoute={(bus) => router.push(`/mot/buses/${bus.id}/assign-route`)}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Bus"
        description={`Are you sure you want to delete bus "${deleteDialog.data?.ntcRegistrationNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}