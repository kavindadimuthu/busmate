'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, Trash2 } from 'lucide-react';
import { ScheduleResponse } from '../../../../generated/api-clients/route-management/models/ScheduleResponse';
import { ScheduleManagementService } from '../../../../generated/api-clients/route-management/services/ScheduleManagementService';
import { RouteManagementService } from '../../../../generated/api-clients/route-management/services/RouteManagementService';
import { ScheduleAdvancedFilters } from '@/components/mot/schedules/ScheduleAdvancedFilters';
import { ScheduleActionButtons } from '@/components/mot/schedules/ScheduleActionButtons';
import { ScheduleStatsCards } from '@/components/mot/schedules/ScheduleStatsCards';
import { SchedulesTable } from '@/components/mot/schedules/SchedulesTable';
import { DataPagination } from '@/components/shared/DataPagination';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  routeId?: string;
  scheduleType?: 'REGULAR' | 'SPECIAL';
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  effectiveStartDate?: string;
  effectiveEndDate?: string;
}

interface FilterOptions {
  statuses: Array<'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED'>;
  scheduleTypes: Array<'REGULAR' | 'SPECIAL'>;
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
}

export default function SchedulesPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Schedules',
    description: 'Manage route schedules with advanced filtering and search capabilities',
    activeItem: 'schedules',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Schedules' }],
  });

  // ── Data state ──────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    scheduleTypes: [],
    routes: [],
  });

  // ── Query params ─────────────────────────────────────────────────
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc',
    search: '',
  });

  // ── Pagination state ─────────────────────────────────────────────
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // ── Stats state ──────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalSchedules:   { count: 0 },
    activeSchedules:  { count: 0 },
    inactiveSchedules:{ count: 0 },
    regularSchedules: { count: 0 },
    specialSchedules: { count: 0 },
    totalRoutes:      { count: 0 },
  });

  // ── Delete modal ─────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const [statusesResponse, typesResponse, routesResponse] = await Promise.all([
        ScheduleManagementService.getDistinctStatuses(),
        ScheduleManagementService.getDistinctScheduleTypes(),
        RouteManagementService.getAllRoutesAsList()
      ]);

      setFilterOptions({
        statuses: statusesResponse || [],
        scheduleTypes: typesResponse || [],
        routes: routesResponse?.map(route => ({
          id: route.id!,
          name: route.name || 'Unnamed Route',
          routeGroup: route.routeGroupName
        })) || []
      });
    } catch (err) {
      console.error('Error loading filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // ── Load statistics ──────────────────────────────────────────────
  const loadStatistics = useCallback(async () => {
    try {
      setStatsLoading(true);
      const s = await ScheduleManagementService.getScheduleStatistics();
      setStats({
        totalSchedules:   { count: s.totalSchedules   || 0 },
        activeSchedules:  { count: s.activeSchedules  || 0 },
        inactiveSchedules:{ count: s.inactiveSchedules|| 0 },
        regularSchedules: { count: s.regularSchedules || 0 },
        specialSchedules: { count: s.specialSchedules || 0 },
        totalRoutes:      { count: s.totalRoutes      || 0 },
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load schedules from API
  const loadSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ScheduleManagementService.getSchedules(
        queryParams.page,
        queryParams.size,
        queryParams.sortBy,
        queryParams.sortDir,
        queryParams.routeId,
        undefined,
        queryParams.scheduleType,
        queryParams.status,
        queryParams.search,
      );

      setSchedules(response.content || []);
      setPagination({
        currentPage: response.number || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageSize: response.size || 10,
      });
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Failed to load schedules. Please try again.');
      setSchedules([]);
      setPagination({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: 10,
      });
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ── Filter change effects ───────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryParams((prev) => {
        const next = { ...prev, page: 0, search: searchTerm };
        if (statusFilter !== 'all') next.status = statusFilter as any; else delete next.status;
        if (scheduleTypeFilter !== 'all') next.scheduleType = scheduleTypeFilter as any; else delete next.scheduleType;
        if (routeFilter !== 'all') next.routeId = routeFilter; else delete next.routeId;
        if (effectiveStartDate) next.effectiveStartDate = effectiveStartDate; else delete next.effectiveStartDate;
        if (effectiveEndDate) next.effectiveEndDate = effectiveEndDate; else delete next.effectiveEndDate;
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, scheduleTypeFilter, routeFilter, effectiveStartDate, effectiveEndDate, searchTerm]);

  // ── Event handlers ──────────────────────────────────────────────
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setQueryParams((prev) => ({ ...prev, search: term, page: 0 }));
  };

  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    setQueryParams((prev) => ({ ...prev, sortBy, sortDir, page: 0 }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (size: number) => {
    setQueryParams((prev) => ({ ...prev, size, page: 0 }));
  };

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setScheduleTypeFilter('all');
    setRouteFilter('all');
    setEffectiveStartDate('');
    setEffectiveEndDate('');
    setQueryParams((prev) => ({
      page: 0,
      size: prev.size,
      sortBy: prev.sortBy,
      sortDir: prev.sortDir,
      search: '',
    }));
  }, []);

  const handleAddNewSchedule  = () => router.push('/mot/schedules/add-new');
  const handleImportSchedules = () => router.push('/mot/schedules/import');

  const handleExportAll = async () => {
    try {
      const all = await ScheduleManagementService.getAllSchedules();
      if (!all || all.length === 0) { toast.error('No schedules to export'); return; }
      const headers = ['Name', 'Route', 'Type', 'Status', 'Effective Start', 'Effective End', 'Created At'];
      const rows = all.map((s) =>
        [s.name, s.routeName, s.scheduleType, s.status, s.effectiveStartDate, s.effectiveEndDate, s.createdAt]
          .map((v) => `"${v || ''}"`).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
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
  };

  const handleView        = (id: string) => router.push(`/mot/schedules/${id}`);
  const handleEdit        = (id: string) => router.push(`/mot/schedules/${id}/edit`);
  const handleAssignBuses = (id: string) => router.push(`/mot/schedules/${id}/assign-buses`);

  const handleDelete = (id: string) => {
    const s = schedules.find((x) => x.id === id);
    if (s) { setScheduleToDelete(s); setShowDeleteModal(true); }
  };

  const handleDeleteCancel = () => { setShowDeleteModal(false); setScheduleToDelete(null); };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete?.id) return;
    try {
      setIsDeleting(true);
      await ScheduleManagementService.deleteSchedule(scheduleToDelete.id);
      toast.success(`Schedule "${scheduleToDelete.name}" deleted successfully`);
      await Promise.all([loadSchedules(), loadStatistics()]);
      handleDeleteCancel();
    } catch {
      toast.error('Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Page actions ───────────────────────────────────────────────
  useSetPageActions(
    <ScheduleActionButtons
      onAddSchedule={handleAddNewSchedule}
      onImportSchedules={handleImportSchedules}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Stats */}
      <ScheduleStatsCards stats={stats} loading={statsLoading} />

      {/* Search & Filters */}
      <ScheduleAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        scheduleTypeFilter={scheduleTypeFilter}
        setScheduleTypeFilter={setScheduleTypeFilter}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        effectiveStartDate={effectiveStartDate}
        setEffectiveStartDate={setEffectiveStartDate}
        effectiveEndDate={effectiveEndDate}
        setEffectiveEndDate={setEffectiveEndDate}
        filterOptions={filterOptions}
        loading={filterOptionsLoading}
        totalCount={pagination.totalElements}
        filteredCount={schedules.length}
        onSearch={handleSearch}
        onClearAll={handleClearAllFilters}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table + Pagination */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SchedulesTable
          schedules={schedules}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignBuses={handleAssignBuses}
          onSort={handleSort}
          activeFilters={{
            search:            searchTerm,
            status:            statusFilter !== 'all' ? statusFilter : undefined,
            scheduleType:      scheduleTypeFilter !== 'all' ? scheduleTypeFilter : undefined,
            route:             routeFilter !== 'all' ? routeFilter : undefined,
            effectiveStartDate,
            effectiveEndDate,
          }}
          loading={isLoading}
          currentSort={{ field: queryParams.sortBy, direction: queryParams.sortDir }}
        />

        {pagination.totalElements > 0 && (
          <div className="border-t border-gray-100">
            <DataPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={isLoading}
              pageSizeOptions={[5, 10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteModal && scheduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Schedule</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">&quot;{scheduleToDelete.name}&quot;</span>?
              All associated data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}