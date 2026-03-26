'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ScheduleResponse,
  ScheduleManagementService,
  RouteManagementService,
} from '@busmate/api-client-route';
import { useDataTable, useDialog } from '@busmate/ui';

import type { ScheduleFilters } from '@/components/mot/schedules/schedules-filter-bar';

interface FilterOptions {
  statuses: string[];
  scheduleTypes: string[];
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
}

const defaultFilters: ScheduleFilters = {
  status: '__all__',
  scheduleType: '__all__',
  routeId: '__all__',
  effectiveStartDate: '',
  effectiveEndDate: '',
};

export function useSchedules() {
  const router = useRouter();

  /* ---- data-table state ---- */
  const {
    state: { searchQuery, sortColumn, sortDirection, page, pageSize, filters },
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
  } = useDataTable<ScheduleFilters>({ initialFilters: defaultFilters });

  /* ---- data state ---- */
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /* ---- filter options ---- */
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    scheduleTypes: [],
    routes: [],
  });

  /* ---- statistics ---- */
  const [stats, setStats] = useState({
    totalSchedules: { count: 0 },
    activeSchedules: { count: 0 },
    inactiveSchedules: { count: 0 },
    regularSchedules: { count: 0 },
    specialSchedules: { count: 0 },
    totalRoutes: { count: 0 },
  });

  /* ---- dialogs ---- */
  const deleteDialog = useDialog<ScheduleResponse>();
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---- load filter options ---- */
  const loadFilterOptions = useCallback(async () => {
    try {
      const [statusesResponse, typesResponse, routesResponse] = await Promise.all([
        ScheduleManagementService.getDistinctStatuses(),
        ScheduleManagementService.getDistinctScheduleTypes(),
        RouteManagementService.getAllRoutesAsList(),
      ]);
      setFilterOptions({
        statuses: statusesResponse || [],
        scheduleTypes: typesResponse || [],
        routes:
          routesResponse?.map((route) => ({
            id: route.id!,
            name: route.name || 'Unnamed Route',
            routeGroup: route.routeGroupName,
          })) || [],
      });
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  }, []);

  /* ---- load statistics ---- */
  const loadStatistics = useCallback(async () => {
    try {
      const s = await ScheduleManagementService.getScheduleStatistics();
      setStats({
        totalSchedules: { count: s.totalSchedules || 0 },
        activeSchedules: { count: s.activeSchedules || 0 },
        inactiveSchedules: { count: s.inactiveSchedules || 0 },
        regularSchedules: { count: s.regularSchedules || 0 },
        specialSchedules: { count: s.specialSchedules || 0 },
        totalRoutes: { count: s.totalRoutes || 0 },
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, []);

  /* ---- load schedules ---- */
  const loadSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const f = filters;
      const statusVal = f.status !== '__all__' ? (f.status as 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED') : undefined;
      const typeVal = f.scheduleType !== '__all__' ? (f.scheduleType as 'REGULAR' | 'SPECIAL') : undefined;
      const routeVal = f.routeId !== '__all__' ? f.routeId : undefined;

      const response = await ScheduleManagementService.getSchedules(
        page - 1,
        pageSize,
        sortColumn || 'name',
        sortDirection || 'asc',
        routeVal,
        undefined,
        typeVal,
        statusVal,
        searchQuery || undefined,
      );

      setSchedules(response.content || []);
      setTotalItems(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading schedules:', err);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchQuery, filters]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  /* ---- action handlers ---- */
  const handleView = useCallback(
    (id: string) => router.push(`/mot/schedules/${id}`),
    [router],
  );

  const handleEdit = useCallback(
    (id: string) => {
      const schedule = schedules.find((x) => x.id === id);
      if (schedule?.routeId) {
        router.push(`/mot/schedules/workspace?routeId=${schedule.routeId}&scheduleId=${id}`);
      }
    },
    [router, schedules],
  );

  const handleAssignBuses = useCallback(
    (id: string) => router.push(`/mot/schedules/${id}/assign-buses`),
    [router],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.data?.id) return;
    try {
      setIsDeleting(true);
      await ScheduleManagementService.deleteSchedule(deleteDialog.data.id);
      toast.success(`Schedule "${deleteDialog.data.name}" deleted successfully`);
      await Promise.all([loadSchedules(), loadStatistics()]);
      deleteDialog.close();
    } catch {
      toast.error('Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, loadSchedules, loadStatistics]);

  const handleExportAll = useCallback(async () => {
    try {
      const all = await ScheduleManagementService.getAllSchedules();
      if (!all || all.length === 0) {
        toast.error('No schedules to export');
        return;
      }
      const headers = ['Name', 'Route', 'Type', 'Status', 'Effective Start', 'Effective End', 'Created At'];
      const rows = all.map((s) =>
        [s.name, s.routeName, s.scheduleType, s.status, s.effectiveStartDate, s.effectiveEndDate, s.createdAt]
          .map((v) => `"${v || ''}"`)
          .join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedules_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.visibility = 'hidden';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} schedules successfully`);
    } catch {
      toast.error('Failed to export schedules');
    }
  }, []);

  /* ---- active filter count ---- */
  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'effectiveStartDate' || key === 'effectiveEndDate') return !!val;
    return val !== '__all__';
  }).length;

  return {
    // Table state
    schedules,
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
    // Filter options & stats
    filterOptions,
    stats,
    activeFilterCount,
    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    // Actions
    handleView,
    handleEdit,
    handleAssignBuses,
    handleExportAll,
  };
}
