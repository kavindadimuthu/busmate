import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAllSalaryRecords,
  computeSalaryStats,
  getMonthlySalarySummaries,
  getSalaryFilterOptions,
  type SalaryRecord,
  type SalaryStats,
  type MonthlySalarySummary,
  type SalaryFilterOptions,
} from '@/data/operator/salary';

import type { FilterSelectConfig } from '@/hooks/operator/revenue-analytics/useRevenueAnalytics';

// ── Tab configuration ─────────────────────────────────────────────

export type SalaryTab = 'overview' | 'records' | 'rules';

// ── Hook ──────────────────────────────────────────────────────────

export function useSalaryManagement() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<SalaryRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<SalaryFilterOptions | null>(null);

  const [activeTab, setActiveTab] = useState<SalaryTab>('overview');
  const [detailRecord, setDetailRecord] = useState<SalaryRecord | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [performanceFilter, setPerformanceFilter] = useState('__all__');
  const [busFilter, setBusFilter] = useState('__all__');
  const [routeFilter, setRouteFilter] = useState('__all__');
  const [dateFilter, setDateFilter] = useState('__all__');

  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'periodStart', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ── Load data ───────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getAllSalaryRecords();
      setAllRecords(records);
      setFilterOptions(getSalaryFilterOptions());
    } catch (error) {
      console.error('Failed to load salary data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered records ────────────────────────────────────────────

  const filteredRecords = useMemo(() => {
    let records = allRecords;

    if (dateFilter !== '__all__') {
      const now = new Date();
      let startDate: Date;
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      const startStr = startDate.toISOString().split('T')[0];
      records = records.filter((r) => r.periodStart >= startStr);
    }

    if (roleFilter !== '__all__') records = records.filter((r) => r.role === roleFilter);
    if (statusFilter !== '__all__') records = records.filter((r) => r.paymentStatus === statusFilter);
    if (performanceFilter !== '__all__') records = records.filter((r) => r.performanceRating === performanceFilter);
    if (busFilter !== '__all__') records = records.filter((r) => r.busAssigned === busFilter);
    if (routeFilter !== '__all__') records = records.filter((r) => r.routeAssigned === routeFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter((r) =>
        r.staffName.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term) ||
        r.busAssigned.toLowerCase().includes(term) ||
        r.routeAssigned.toLowerCase().includes(term) ||
        r.role.toLowerCase().includes(term),
      );
    }

    return records;
  }, [allRecords, dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter, searchTerm]);

  // ── Sorted records ──────────────────────────────────────────────

  const sortedRecords = useMemo(() => {
    if (!sort.field) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      const aVal = (a as Record<string, any>)[sort.field];
      const bVal = (b as Record<string, any>)[sort.field];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sort.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredRecords, sort]);

  // ── Paginated records ───────────────────────────────────────────

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;

  // ── Computed analytics ──────────────────────────────────────────

  const stats: SalaryStats | null = useMemo(
    () => (filteredRecords.length > 0 ? computeSalaryStats(filteredRecords) : null),
    [filteredRecords],
  );

  const monthlySummaries: MonthlySalarySummary[] = useMemo(
    () => getMonthlySalarySummaries(filteredRecords),
    [filteredRecords],
  );

  // ── Handlers ────────────────────────────────────────────────────

  const handleSort = useCallback((column: string) => {
    setSort((prev) => ({
      field: column,
      direction: prev.field === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearchTerm(v);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('__all__');
    setStatusFilter('__all__');
    setPerformanceFilter('__all__');
    setBusFilter('__all__');
    setRouteFilter('__all__');
    setDateFilter('__all__');
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    alert('Generating salary report...');
  }, []);

  const handleViewDetail = useCallback((record: SalaryRecord) => {
    setDetailRecord(record);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailRecord(null);
  }, []);

  // ── Filter select configs ───────────────────────────────────────

  const filterSelectConfigs: FilterSelectConfig[] = useMemo(() => {
    if (!filterOptions) return [];
    return [
      {
        key: 'date',
        value: dateFilter,
        onChange: (v: string) => { setDateFilter(v); setCurrentPage(1); },
        options: [
          { value: 'today', label: 'Today' },
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
        ],
        label: 'Dates',
      },
      {
        key: 'role',
        value: roleFilter,
        onChange: (v: string) => { setRoleFilter(v); setCurrentPage(1); },
        options: filterOptions.roles,
        label: 'Roles',
      },
      {
        key: 'status',
        value: statusFilter,
        onChange: (v: string) => { setStatusFilter(v); setCurrentPage(1); },
        options: filterOptions.statuses,
        label: 'Statuses',
      },
      {
        key: 'performance',
        value: performanceFilter,
        onChange: (v: string) => { setPerformanceFilter(v); setCurrentPage(1); },
        options: filterOptions.performanceRatings,
        label: 'Performance',
      },
      {
        key: 'bus',
        value: busFilter,
        onChange: (v: string) => { setBusFilter(v); setCurrentPage(1); },
        options: filterOptions.buses,
        label: 'Buses',
      },
      {
        key: 'route',
        value: routeFilter,
        onChange: (v: string) => { setRouteFilter(v); setCurrentPage(1); },
        options: filterOptions.routes,
        label: 'Routes',
      },
    ];
  }, [filterOptions, dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter]);

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    return [dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter]
      .filter((v) => v !== '__all__').length;
  }, [dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter]);

  return {
    activeTab,
    setActiveTab,
    loading,
    allRecords,
    filteredRecords,
    sortedRecords,
    paginatedRecords,
    totalPages,
    stats,
    monthlySummaries,
    sort,
    currentPage,
    setCurrentPage,
    pageSize,
    searchTerm,
    detailRecord,
    filterSelectConfigs,
    activeFilterCount,
    handleSort,
    handlePageSizeChange,
    handleSearchChange,
    handleClearAllFilters,
    handleExport,
    handleViewDetail,
    handleCloseDetail,
    loadData,
  };
}
