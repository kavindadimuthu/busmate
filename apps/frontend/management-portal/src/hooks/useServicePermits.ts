'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMockPermits,
  getMockPermitStatistics,
  getMockPermitFilterOptions,
  type OperatorPermit,
  type OperatorPermitStatistics,
  type OperatorPermitFilterOptions,
} from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitFilters {
  search: string;
  status: string;
  permitType: string;
}

interface PermitPagination {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

interface PermitSort {
  column: string;
  direction: 'asc' | 'desc';
}

// ── Hook ──────────────────────────────────────────────────────────

export function useServicePermits() {
  const router = useRouter();

  const [permits, setPermits] = useState<OperatorPermit[]>([]);
  const [statistics, setStatistics] = useState<OperatorPermitStatistics | null>(null);
  const [filterOptions, setFilterOptions] = useState<OperatorPermitFilterOptions>({
    statuses: [],
    permitTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<PermitFilters>({
    search: '',
    status: '__all__',
    permitType: '__all__',
  });

  const [pagination, setPagination] = useState<PermitPagination>({
    currentPage: 1,
    totalPages: 1,
    totalElements: 0,
    pageSize: 10,
  });

  const [sort, setSort] = useState<PermitSort>({
    column: 'issueDate',
    direction: 'desc',
  });

  // ── Data Loading ────────────────────────────────────────────────

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const result = getMockPermits({
        search: filters.search,
        status: filters.status,
        permitType: filters.permitType,
        sortBy: sort.column,
        sortDir: sort.direction,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      });

      setPermits(result.permits);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.totalPages,
        totalElements: result.total,
      }));

      const stats = getMockPermitStatistics();
      setStatistics(stats);

      const opts = getMockPermitFilterOptions();
      setFilterOptions(opts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permits');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [filters, sort, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleView = useCallback(
    (permitId: string) => {
      router.push(`/operator/passenger-service-permits/${permitId}`);
    },
    [router],
  );

  const handleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleFilterChange = useCallback((updates: Partial<PermitFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFiltersState({ search: '', status: '__all__', permitType: '__all__' });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const onPageSizeChange = useCallback((size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
  }, []);

  return {
    permits,
    statistics,
    filterOptions,
    error,
    setError,
    loading,
    initialized,
    filters,
    pagination,
    sort,
    handleView,
    handleSort,
    handleFilterChange,
    handleClearFilters,
    handleRefresh,
    onPageChange,
    onPageSizeChange,
  };
}
