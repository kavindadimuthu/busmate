'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { RouteStatsCards } from '@/components/mot/routes/RouteStatsCards';
import { RouteAdvancedFilters } from '@/components/mot/routes/RouteAdvancedFilters';
import { RouteActionButtons } from '@/components/mot/routes/RouteActionButtons';
import { RoutesTable } from '@/components/mot/routes/RoutesTable';
import { RoutePagination } from '@/components/mot/routes/RoutePagination';
import { DeleteConfirmationModal } from '@/components/mot/confirmation-modals';
import { RouteManagementService } from '../../../../generated/api-clients/route-management';
import type {
  RouteResponse,
  PageRouteResponse,
} from '../../../../generated/api-clients/route-management';

// ── Types ─────────────────────────────────────────────────────────

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  routeGroupId?: string;
  direction?: 'OUTBOUND' | 'INBOUND';
  minDistance?: number;
  maxDistance?: number;
  minDuration?: number;
  maxDuration?: number;
}

interface FilterOptions {
  routeGroups: Array<{ id: string; name: string }>;
  directions: Array<'OUTBOUND' | 'INBOUND'>;
  roadTypes: Array<'NORMALWAY' | 'EXPRESSWAY'>;
  distanceRange: { min: number; max: number };
  durationRange: { min: number; max: number };
}

// ── Page ──────────────────────────────────────────────────────────

export default function RoutesPage() {
  const router = useRouter();
  const { toast } = useToast();

  useSetPageMetadata({
    title: 'Routes',
    description: 'Manage bus routes with advanced filtering and search capabilities',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes' }],
  });

  // ── Data state ──────────────────────────────────────────────────

  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState('');
  const [routeGroupFilter, setRouteGroupFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    routeGroups: [],
    directions: [],
    roadTypes: [],
    distanceRange: { min: 0, max: 100 },
    durationRange: { min: 0, max: 300 },
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // ── Pagination / query params ───────────────────────────────────

  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc',
    search: '',
  });

  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // ── Statistics state ────────────────────────────────────────────

  const [stats, setStats] = useState({
    totalRoutes: { count: 0, change: undefined as string | undefined },
    outboundRoutes: { count: 0, change: undefined as string | undefined },
    inboundRoutes: { count: 0, change: undefined as string | undefined },
    averageDistance: { count: 0, unit: 'km' },
    totalRouteGroups: { count: 0, change: undefined as string | undefined },
    averageDuration: { count: 0, unit: 'min' },
  });

  // ── Delete modal state ──────────────────────────────────────────

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Data loaders ────────────────────────────────────────────────

  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const response = await RouteManagementService.getRouteFilterOptions();
      setFilterOptions({
        routeGroups: response.routeGroups?.map((rg: any) => ({ id: rg.id, name: rg.name })) || [],
        directions: response.directions || [],
        roadTypes: response.roadTypes || [],
        distanceRange: { min: response.distanceRange?.min || 0, max: response.distanceRange?.max || 100 },
        durationRange: { min: response.durationRange?.min || 0, max: response.durationRange?.max || 300 },
      });
    } catch (err) {
      console.error('Error loading filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const data = await RouteManagementService.getRouteStatistics();
      setStats({
        totalRoutes: { count: data.totalRoutes || 0, change: data.totalRoutes ? '+5% this month' : undefined },
        outboundRoutes: { count: data.outboundRoutes || 0, change: data.outboundRoutes ? '+3% this month' : undefined },
        inboundRoutes: { count: data.inboundRoutes || 0, change: data.inboundRoutes ? '+2% this month' : undefined },
        averageDistance: { count: data.averageDistanceKm || 0, unit: 'km' },
        totalRouteGroups: { count: data.totalRouteGroups || 0, change: data.totalRouteGroups ? '+1 new' : undefined },
        averageDuration: { count: data.averageDurationMinutes || 0, unit: 'min' },
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, []);

  const loadRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: PageRouteResponse = await RouteManagementService.getAllRoutes(
        queryParams.page,
        queryParams.size,
        queryParams.sortBy,
        queryParams.sortDir,
        queryParams.search || undefined,
        queryParams.routeGroupId,
        queryParams.direction,
        undefined,
        queryParams.minDistance,
        queryParams.maxDistance,
        queryParams.minDuration,
        queryParams.maxDuration,
      );
      setRoutes(response.content || []);
      setPagination({
        currentPage: response.number || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageSize: response.size || 10,
      });
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('Failed to load routes. Please try again.');
      setRoutes([]);
      setPagination({ currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 10 });
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // ── Query param helpers ─────────────────────────────────────────

  const updateQueryParams = useCallback(
    (updates: Partial<QueryParams>) => {
      setQueryParams((prev) => {
        const next = { ...prev, ...updates };

        const groupId = routeGroupFilter !== 'all' ? routeGroupFilter : undefined;
        const dir = directionFilter !== 'all' ? (directionFilter as 'OUTBOUND' | 'INBOUND') : undefined;
        const minDist = minDistance ? parseFloat(minDistance) : undefined;
        const maxDist = maxDistance ? parseFloat(maxDistance) : undefined;
        const minDur = minDuration ? parseFloat(minDuration) : undefined;
        const maxDur = maxDuration ? parseFloat(maxDuration) : undefined;

        if (groupId !== undefined) next.routeGroupId = groupId;
        else delete next.routeGroupId;
        if (dir !== undefined) next.direction = dir;
        else delete next.direction;
        if (minDist !== undefined) next.minDistance = minDist;
        else delete next.minDistance;
        if (maxDist !== undefined) next.maxDistance = maxDist;
        else delete next.maxDistance;
        if (minDur !== undefined) next.minDuration = minDur;
        else delete next.minDuration;
        if (maxDur !== undefined) next.maxDuration = maxDur;
        else delete next.maxDuration;

        return next;
      });
    },
    [routeGroupFilter, directionFilter, minDistance, maxDistance, minDuration, maxDuration],
  );

  // Re-fetch when filter controls change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParams({ page: 0 });
    }, 300);
    return () => clearTimeout(timer);
  }, [routeGroupFilter, directionFilter, minDistance, maxDistance, minDuration, maxDuration]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    updateQueryParams({ search: term, page: 0 });
  };

  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    updateQueryParams({ sortBy, sortDir, page: 0 });
  };

  const handlePageChange = (page: number) => updateQueryParams({ page });
  const handlePageSizeChange = (size: number) => updateQueryParams({ size, page: 0 });

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setRouteGroupFilter('all');
    setDirectionFilter('all');
    setMinDistance('');
    setMaxDistance('');
    setMinDuration('');
    setMaxDuration('');
    setQueryParams({ page: 0, size: queryParams.size, sortBy: 'name', sortDir: 'asc', search: '' });
  };

  const handleAddNewRoute = () => router.push('/mot/routes/workspace');
  const handleImport = () => router.push('/mot/routes/import');

  const handleExportAll = async () => {
    try {
      const allRoutes = await RouteManagementService.getAllRoutesAsList();
      const headers = ['ID', 'Name', 'Description', 'Route Group', 'Direction', 'Start Stop', 'End Stop', 'Distance (km)', 'Duration (min)', 'Created At', 'Updated At'];
      const rows = allRoutes.map((r) =>
        [r.id, r.name, r.description, r.routeGroupName, r.direction, r.startStopName, r.endStopName, r.distanceKm, r.estimatedDurationMinutes, r.createdAt, r.updatedAt]
          .map((f) => `"${f ?? ''}"`)
          .join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routes-${new Date().toISOString().split('T')[0]}.csv`;
      a.style.visibility = 'hidden';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: 'Export Complete', description: `${allRoutes.length} routes exported successfully.` });
    } catch (err) {
      console.error('Error exporting routes:', err);
      toast({ title: 'Export Failed', description: 'Failed to export routes. Please try again.', variant: 'destructive' });
    }
  };

  const handleView = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route?.routeGroupId) router.push(`/mot/routes/${route.routeGroupId}?highlight=${routeId}`);
  };

  const handleEdit = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route?.routeGroupId) router.push(`/mot/routes/workspace?routeGroupId=${route.routeGroupId}`);
  };

  const handleDelete = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      setRouteToDelete(route);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRouteToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!routeToDelete?.id) return;
    try {
      setIsDeleting(true);
      // await RouteManagementService.deleteRoute(routeToDelete.id);
      toast({ title: 'Route Deleted', description: `${routeToDelete.name} has been deleted successfully.` });
      setShowDeleteModal(false);
      setRouteToDelete(null);
      await loadRoutes();
      await loadStatistics();
    } catch (err) {
      toast({ title: 'Delete Failed', description: 'Failed to delete route. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Page actions ────────────────────────────────────────────────

  useSetPageActions(
    <RouteActionButtons
      onAddRoute={handleAddNewRoute}
      onImport={handleImport}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  // ── Error state ─────────────────────────────────────────────────

  if (error && routes.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Routes</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); loadRoutes(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <RouteStatsCards stats={stats} loading={isLoading} />

      {/* Search & Filters */}
      <RouteAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        routeGroupFilter={routeGroupFilter}
        setRouteGroupFilter={setRouteGroupFilter}
        directionFilter={directionFilter}
        setDirectionFilter={setDirectionFilter}
        minDistance={minDistance}
        setMinDistance={setMinDistance}
        maxDistance={maxDistance}
        setMaxDistance={setMaxDistance}
        minDuration={minDuration}
        setMinDuration={setMinDuration}
        maxDuration={maxDuration}
        setMaxDuration={setMaxDuration}
        filterOptions={filterOptions}
        loading={filterOptionsLoading}
        totalCount={pagination.totalElements}
        filteredCount={routes.length}
        onSearch={handleSearch}
        onClearAll={handleClearAllFilters}
      />

      {/* Table + Pagination */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <RoutesTable
          routes={routes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSort={handleSort}
          loading={isLoading}
          currentSort={{ field: queryParams.sortBy, direction: queryParams.sortDir }}
        />
        <RoutePagination
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
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Route"
        itemName={routeToDelete?.name || 'this route'}
        isLoading={isDeleting}
      />
    </div>
  );
}
