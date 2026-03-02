'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitStatsCards } from '@/components/operator/permits/PermitStatsCards';
import { PermitFilters } from '@/components/operator/permits/PermitFilters';
import { PermitsTable } from '@/components/operator/permits/PermitsTable';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  getMockPermits,
  getMockPermitStatistics,
  getMockPermitFilterOptions,
  type OperatorPermit,
  type OperatorPermitStatistics,
  type OperatorPermitFilterOptions,
} from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface FiltersState {
  search: string;
  status: string;
  permitType: string;
}

interface PaginationState {
  /** Zero-based page index (matches DataPagination contract). */
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// ─── Main content component ────────────────────────────────────────────────────
// Wrapped in Suspense because useSearchParams() requires it in Next.js App Router.

function ServicePermitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useSetPageMetadata({
    title: 'Service Permits',
    description: 'View your passenger service permits issued by the Ministry of Transport',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Service Permits' }],
  });

  // ── Data ─────────────────────────────────────────────────────────────────
  const [permits, setPermits] = useState<OperatorPermit[]>([]);
  const [statistics, setStatistics] = useState<OperatorPermitStatistics | null>(null);
  const [filterOptions, setFilterOptions] = useState<OperatorPermitFilterOptions>({
    statuses: [],
    permitTypes: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ── Filters (URL-synced) ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<FiltersState>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    permitType: searchParams.get('permitType') || 'all',
  });

  // ── Pagination & Sort (URL-synced) ────────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    // URL uses 1-based page numbers for readability; convert to 0-based internally.
    currentPage: Math.max(0, parseInt(searchParams.get('page') || '1') - 1),
    totalPages: 0,
    totalElements: 0,
    pageSize: parseInt(searchParams.get('size') || '10'),
  });

  const [sort, setSort] = useState<SortState>({
    field: searchParams.get('sortBy') || 'issueDate',
    direction: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc',
  });

  // ── Sync state to URL ─────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.permitType !== 'all') params.set('permitType', filters.permitType);
    // Convert 0-based back to 1-based for the URL
    if (pagination.currentPage > 0) params.set('page', String(pagination.currentPage + 1));
    if (pagination.pageSize !== 10) params.set('size', String(pagination.pageSize));
    if (sort.field !== 'issueDate') params.set('sortBy', sort.field);
    if (sort.direction !== 'desc') params.set('sortDir', sort.direction);

    const qs = params.toString();
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters, pagination.currentPage, pagination.pageSize, sort]);

  // ── Load statistics & filter options ─────────────────────────────────────
  const loadInitialData = useCallback(() => {
    try {
      setStatistics(getMockPermitStatistics());
      setFilterOptions(getMockPermitFilterOptions());
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ── Load permits ─────────────────────────────────────────────────────────
  const loadPermits = useCallback(() => {
    if (!initialized) return;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        const result = getMockPermits({
          search: filters.search,
          status: filters.status,
          permitType: filters.permitType,
          sortBy: sort.field,
          sortDir: sort.direction,
          // getMockPermits uses 1-based page numbers
          page: pagination.currentPage + 1,
          pageSize: pagination.pageSize,
        });

        setPermits(result.permits);
        setPagination((prev) => ({
          ...prev,
          totalPages: result.totalPages,
          totalElements: result.total,
        }));
      } catch (err) {
        console.error('Failed to load permits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load permits. Please try again.');
        setPermits([]);
        setPagination((prev) => ({ ...prev, totalPages: 0, totalElements: 0 }));
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [initialized, filters, sort, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    loadPermits();
  }, [loadPermits]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleView = useCallback(
    (id: string) => {
      router.push(`/operator/passenger-service-permits/${id}`);
    },
    [router],
  );

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  const handleFilterChange = useCallback((partial: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', permitType: 'all' });
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    loadInitialData();
    loadPermits();
  }, [loadInitialData, loadPermits]);

  // ── Page-level action buttons ─────────────────────────────────────────────

  useSetPageActions(
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load permits</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <PermitStatsCards stats={statistics} loading={!initialized} />

      {/* Filters */}
      <PermitFilters
        searchTerm={filters.search}
        setSearchTerm={(v) => handleFilterChange({ search: v })}
        statusFilter={filters.status}
        setStatusFilter={(v) => handleFilterChange({ status: v })}
        permitTypeFilter={filters.permitType}
        setPermitTypeFilter={(v) => handleFilterChange({ permitType: v })}
        filterOptions={filterOptions}
        loading={loading}
        totalCount={statistics?.totalPermits ?? 0}
        filteredCount={pagination.totalElements}
        onClearAll={handleClearFilters}
      />

      {/* Table + Pagination card */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <PermitsTable
          permits={permits}
          loading={loading}
          currentSort={sort}
          onSort={handleSort}
          onView={handleView}
        />
        <DataPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
          onPageSizeChange={(size) =>
            setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 0 }))
          }
          loading={loading}
        />
      </div>

      {/* Read-only info notice */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Service permits are issued and managed by the Ministry of Transport. This view is
          read-only. Contact the MOT to request changes or renewals.
        </span>
      </div>
    </div>
  );
}

// ─── Page export ────────────────────────────────────────────────────────────────

export default function ServicePermitsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading…</span>
          </div>
        </div>
      }
    >
      <ServicePermitsContent />
    </Suspense>
  );
}
