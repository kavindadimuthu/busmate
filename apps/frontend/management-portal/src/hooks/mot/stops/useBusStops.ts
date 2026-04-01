'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BusStopManagementService } from '@busmate/api-client-route';
import type { StopResponse, PageStopResponse } from '@busmate/api-client-route';
import { useDataTable, useDialog } from '@busmate/ui';

import type { BusStopFilters } from '@/components/mot/stops/BusStopsFilterBar';
import { useToast } from '@/hooks/use-toast';

type ViewType = 'table' | 'map';
const INITIAL_FILTERS: BusStopFilters = { state: '__all__', accessibility: '__all__' };

export function useBusStops() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Table state (pagination, sort, filters) ──────────────────────
  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<BusStopFilters>({
      initialPageSize: 10,
      initialSort: { column: 'name', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<StopResponse>();
  const [currentView, setCurrentView] = useState<ViewType>('table');

  // ── Server data ──────────────────────────────────────────────────
  const [allBusStops, setAllBusStops] = useState<StopResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalStops: { count: 0 },
    accessibleStops: { count: 0 },
    nonAccessibleStops: { count: 0 },
    totalStates: { count: 0 },
    totalCities: { count: 0 },
  });
  const [filterOptions, setFilterOptions] = useState<{ states: string[] }>({ states: [] });

  // ── Initial load: filter options + statistics ────────────────────
  useEffect(() => {
    BusStopManagementService.getStopFilterOptions()
      .then((res) => setFilterOptions({ states: (res.states || []).filter((s) => s && s.trim() !== '') }))
      .catch(console.error);

    BusStopManagementService.getStopStatistics()
      .then((res) =>
        setStats({
          totalStops: { count: res.totalStops || 0 },
          accessibleStops: { count: res.accessibleStops || 0 },
          nonAccessibleStops: { count: res.nonAccessibleStops || 0 },
          totalStates: { count: Object.keys(res.stopsByState || {}).length },
          totalCities: { count: Object.keys(res.stopsByCity || {}).length },
        }),
      )
      .catch(console.error);
  }, []);

  // ── Data load: re-runs when state changes ────────────────────────
  const loadBusStops = useCallback(async () => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;
    const hasFilters =
      searchQuery ||
      (filters.state && filters.state !== '__all__') ||
      (filters.accessibility && filters.accessibility !== '__all__');

    try {
      setIsLoading(true);
      if (hasFilters) {
        let results: StopResponse[] = [];
        let apiPage = 0;
        let hasMore = true;
        while (hasMore) {
          const res: PageStopResponse = await BusStopManagementService.getAllStops(
            apiPage++,
            500,
            sortColumn ?? 'name',
            sortDirection,
            searchQuery || undefined,
          );
          results = [...results, ...(res.content ?? [])];
          hasMore = !res.last && (res.content?.length ?? 0) === 500;
        }
        setAllBusStops(results);
      } else {
        const res: PageStopResponse = await BusStopManagementService.getAllStops(
          page - 1,
          pageSize,
          sortColumn ?? 'name',
          sortDirection,
        );
        setAllBusStops(res.content ?? []);
      }
    } catch {
      toast({ title: 'Failed to load bus stops', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [state, toast]);

  useEffect(() => {
    loadBusStops();
  }, [
    state.searchQuery,
    state.sortColumn,
    state.sortDirection,
    state.page,
    state.pageSize,
    state.filters.state,
    state.filters.accessibility,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client-side filter + paginate ───────────────────────────────
  const filteredTableData = useMemo(() => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;
    const hasFilters =
      searchQuery ||
      (filters.state && filters.state !== '__all__') ||
      (filters.accessibility && filters.accessibility !== '__all__');

    if (!hasFilters) {
      return { data: allBusStops, totalItems: stats.totalStops.count };
    }

    let filtered = allBusStops;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.location?.city?.toLowerCase().includes(q) ||
          s.location?.state?.toLowerCase().includes(q) ||
          s.location?.address?.toLowerCase().includes(q),
      );
    }
    if (filters.state && filters.state !== '__all__') {
      filtered = filtered.filter((s) => s.location?.state === filters.state);
    }
    if (filters.accessibility && filters.accessibility !== '__all__') {
      const want = filters.accessibility === 'accessible';
      filtered = filtered.filter((s) => s.isAccessible === want);
    }

    filtered = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const key = sortColumn ?? 'name';
      const av =
        key === 'createdAt' ? (a.createdAt ?? '') :
        key === 'isAccessible' ? String(a.isAccessible) : (a.name ?? '');
      const bv =
        key === 'createdAt' ? (b.createdAt ?? '') :
        key === 'isAccessible' ? String(b.isAccessible) : (b.name ?? '');
      return av.localeCompare(bv) * dir;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), totalItems: total };
  }, [allBusStops, state, stats.totalStops.count]);

  // ── Delete ───────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    const stop = deleteDialog.data;
    if (!stop) return;
    try {
      setIsDeleting(true);
      await BusStopManagementService.deleteStop(stop.id!);
      toast({ title: 'Bus Stop Deleted', description: `${stop.name} has been deleted.` });
      deleteDialog.close();
      loadBusStops();
      BusStopManagementService.getStopStatistics()
        .then((res) =>
          setStats({
            totalStops: { count: res.totalStops || 0 },
            accessibleStops: { count: res.accessibleStops || 0 },
            nonAccessibleStops: { count: res.nonAccessibleStops || 0 },
            totalStates: { count: Object.keys(res.stopsByState || {}).length },
            totalCities: { count: Object.keys(res.stopsByCity || {}).length },
          }),
        )
        .catch(console.error);
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete bus stop.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, loadBusStops, toast]);

  // ── Navigation handlers ────────────────────────────────────────
  const handleView = useCallback(
    (stop: StopResponse) => router.push(`/mot/stops/${stop.id}`),
    [router],
  );

  const handleEdit = useCallback(
    (stop: StopResponse) => router.push(`/mot/stops/${stop.id}/edit`),
    [router],
  );

  const activeFilterCount =
    (state.filters.state && state.filters.state !== '__all__' ? 1 : 0) +
    (state.filters.accessibility && state.filters.accessibility !== '__all__' ? 1 : 0);

  return {
    // View state
    currentView,
    setCurrentView,
    // Table state
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    // Data
    filteredTableData,
    isLoading,
    stats,
    filterOptions,
    activeFilterCount,
    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    // Actions
    handleView,
    handleEdit,
  };
}
