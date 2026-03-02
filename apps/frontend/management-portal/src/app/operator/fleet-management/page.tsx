'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Info } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  FleetStatsCards,
  FleetFilters,
  FleetTable,
} from '@/components/operator/fleet';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  getOperatorBuses,
  getFleetStatistics,
  type OperatorBus,
  type BusStatus,
  type BusServiceType,
  type FleetStatistics,
  type PaginatedBuses,
} from '@/data/operator/buses';

export default function FleetManagementPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Fleet Management',
    description: 'View details of all buses in your fleet. Contact NTC to register or update bus information.',
    activeItem: 'fleetmanagement',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet Management' }],
  });

  // ── Data state ────────────────────────────────────────────────────────────

  const [buses,      setBuses]      = useState<OperatorBus[]>([]);
  const [stats,      setStats]      = useState<FleetStatistics>({
    totalBuses: 0, activeBuses: 0, inactiveBuses: 0,
    maintenanceBuses: 0, totalCapacity: 0, averageCapacity: 0,
  });
  const [pagination, setPagination] = useState<Omit<PaginatedBuses, 'content'>>({
    totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10,
  });

  // ── UI state ──────────────────────────────────────────────────────────────

  const [isLoading,    setIsLoading]    = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Filter / sort / page state ────────────────────────────────────────────

  const [search,            setSearch]            = useState('');
  const [statusFilter,      setStatusFilter]      = useState<BusStatus | 'ALL'>('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<BusServiceType | 'ALL'>('ALL');
  const [currentPage,       setCurrentPage]       = useState(0);
  const [pageSize,          setPageSize]          = useState(10);
  const [sortField,         setSortField]         = useState('plateNumber');
  const [sortDir,           setSortDir]           = useState<'asc' | 'desc'>('asc');

  // ── Load statistics (once) ────────────────────────────────────────────────

  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getFleetStatistics();
      setStats(s);
    } catch {
      // Statistics are non-critical; fail silently.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // ── Load buses ────────────────────────────────────────────────────────────

  const loadBuses = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setIsLoading(true); else setTableLoading(true);
    setError(null);

    try {
      const result = await getOperatorBuses({
        page: currentPage,
        size: pageSize,
        search,
        status: statusFilter,
        serviceType: serviceTypeFilter,
      });

      setBuses(result.content);
      setPagination({
        totalElements: result.totalElements,
        totalPages:    result.totalPages,
        currentPage:   result.currentPage,
        pageSize:      result.pageSize,
      });
    } catch (err) {
      console.error('Error loading fleet:', err);
      setError('Failed to load fleet data. Please try again.');
    } finally {
      setIsLoading(false);
      setTableLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter, serviceTypeFilter]);

  useEffect(() => {
    loadBuses(isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBuses]);

  // ── Page-level actions (header toolbar) ───────────────────────────────────

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadBuses()]);
  }, [loadStatistics, loadBuses]);

  useSetPageActions(
    <button
      onClick={handleRefresh}
      disabled={isLoading || tableLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isLoading || tableLoading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );

  // ── Filter / sort handlers ────────────────────────────────────────────────

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setCurrentPage(0);
  }, []);

  const handleStatusChange = useCallback((v: BusStatus | 'ALL') => {
    setStatusFilter(v);
    setCurrentPage(0);
  }, []);

  const handleServiceTypeChange = useCallback((v: BusServiceType | 'ALL') => {
    setServiceTypeFilter(v);
    setCurrentPage(0);
  }, []);

  const handleClearAll = useCallback(() => {
    setSearch('');
    setStatusFilter('ALL');
    setServiceTypeFilter('ALL');
    setCurrentPage(0);
  }, []);

  const handleView = useCallback((busId: string) => {
    router.push(`/operator/fleet-management/${busId}`);
  }, [router]);

  const handleSort = useCallback((field: string, dir: 'asc' | 'desc') => {
    setSortField(field);
    setSortDir(dir);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL' || serviceTypeFilter !== 'ALL';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <FleetStatsCards stats={stats} loading={statsLoading} />

      {/* Search & Filters */}
      <FleetFilters
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        serviceTypeFilter={serviceTypeFilter}
        onServiceTypeChange={handleServiceTypeChange}
        onClearAll={handleClearAll}
        totalCount={stats.totalBuses}
        filteredCount={pagination.totalElements}
        loading={tableLoading}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
          <div className="flex-1">
            <span className="font-semibold">Error: </span>{error}
          </div>
          <button
            onClick={() => loadBuses()}
            className="shrink-0 text-red-600 underline hover:no-underline text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table + Pagination Card */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <FleetTable
          buses={buses}
          onView={handleView}
          onSort={handleSort}
          currentSort={{ field: sortField, direction: sortDir }}
          loading={isLoading || tableLoading}
          hasActiveFilters={hasActiveFilters}
        />

        {!error && pagination.totalElements > 0 && (
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={tableLoading}
          />
        )}
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <p>
          <span className="font-semibold">Read-only view:</span>{' '}
          Fleet registration and modifications are managed by the National Transport Commission (NTC).
          Please contact NTC for any changes to your fleet.
        </p>
      </div>

    </div>
  );
}
