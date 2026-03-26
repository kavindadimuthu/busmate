import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
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
import type { SortState } from '@/components/shared/DataTable';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import type { TabItem } from '@/components/shared/SwitchableTabs';
import type { FilterSelectConfig } from '@/components/operator/revenue-analytics/useRevenueAnalytics';
import { Award, BarChart3, BookOpen, Bus, MapPin, Shield, TableProperties } from 'lucide-react';

// ── Tab configuration ─────────────────────────────────────────────

export type SalaryTab = 'overview' | 'records' | 'rules';

export const SALARY_TABS: TabItem<SalaryTab>[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'records', label: 'Salary Records', icon: TableProperties },
  { id: 'rules', label: 'Salary Rules', icon: BookOpen },
];

// ── Hook ──────────────────────────────────────────────────────────

export function useSalaryManagement() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<SalaryRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<SalaryFilterOptions | null>(null);

  const [activeTab, setActiveTab] = useState<SalaryTab>('overview');
  const [detailRecord, setDetailRecord] = useState<SalaryRecord | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [sort, setSort] = useState<SortState>({ field: 'periodStart', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(0);
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

    if (dateFilter !== 'all') {
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

    if (roleFilter !== 'all') records = records.filter((r) => r.role === roleFilter);
    if (statusFilter !== 'all') records = records.filter((r) => r.paymentStatus === statusFilter);
    if (performanceFilter !== 'all') records = records.filter((r) => r.performanceRating === performanceFilter);
    if (busFilter !== 'all') records = records.filter((r) => r.busAssigned === busFilter);
    if (routeFilter !== 'all') records = records.filter((r) => r.routeAssigned === routeFilter);

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
    const start = currentPage * pageSize;
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

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearchTerm(v);
    setCurrentPage(0);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPerformanceFilter('all');
    setBusFilter('all');
    setRouteFilter('all');
    setDateFilter('all');
    setCurrentPage(0);
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
        onChange: (v: string) => { setDateFilter(v); setCurrentPage(0); },
        options: [
          { value: 'today', label: 'Today' },
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
        ],
        allLabel: 'All Dates',
        activeColorClass: 'bg-primary/10 border-primary/30 text-primary',
      },
      {
        key: 'role',
        value: roleFilter,
        onChange: (v: string) => { setRoleFilter(v); setCurrentPage(0); },
        options: filterOptions.roles,
        allLabel: 'All Roles',
        icon: React.createElement(Shield, { className: 'h-3.5 w-3.5' }),
      },
      {
        key: 'status',
        value: statusFilter,
        onChange: (v: string) => { setStatusFilter(v); setCurrentPage(0); },
        options: filterOptions.statuses,
        allLabel: 'All Statuses',
      },
      {
        key: 'performance',
        value: performanceFilter,
        onChange: (v: string) => { setPerformanceFilter(v); setCurrentPage(0); },
        options: filterOptions.performanceRatings,
        allLabel: 'All Performance',
        icon: React.createElement(Award, { className: 'h-3.5 w-3.5' }),
      },
      {
        key: 'bus',
        value: busFilter,
        onChange: (v: string) => { setBusFilter(v); setCurrentPage(0); },
        options: filterOptions.buses,
        allLabel: 'All Buses',
        icon: React.createElement(Bus, { className: 'h-3.5 w-3.5' }),
      },
      {
        key: 'route',
        value: routeFilter,
        onChange: (v: string) => { setRouteFilter(v); setCurrentPage(0); },
        options: filterOptions.routes,
        allLabel: 'All Routes',
        icon: React.createElement(MapPin, { className: 'h-3.5 w-3.5' }),
      },
    ];
  }, [filterOptions, dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter]);

  // ── Active filter chips ─────────────────────────────────────────

  const activeChips: FilterChipDescriptor[] = useMemo(() => {
    const chips: FilterChipDescriptor[] = [];

    if (dateFilter !== 'all') {
      const labels: Record<string, string> = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' };
      chips.push({
        key: 'date',
        label: labels[dateFilter] ?? dateFilter,
        onRemove: () => setDateFilter('all'),
        colorClass: 'bg-primary/10 text-primary border-primary/20',
      });
    }

    if (roleFilter !== 'all') {
      const role = filterOptions?.roles.find((r) => r.value === roleFilter);
      chips.push({
        key: 'role',
        label: role?.label ?? roleFilter,
        onRemove: () => setRoleFilter('all'),
        colorClass: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]',
        icon: React.createElement(Shield, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (statusFilter !== 'all') {
      const st = filterOptions?.statuses.find((s) => s.value === statusFilter);
      chips.push({
        key: 'status',
        label: st?.label ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-success/10 text-success border-success/20',
      });
    }

    if (performanceFilter !== 'all') {
      const perf = filterOptions?.performanceRatings.find((p) => p.value === performanceFilter);
      chips.push({
        key: 'performance',
        label: perf?.label ?? performanceFilter,
        onRemove: () => setPerformanceFilter('all'),
        colorClass: 'bg-warning/10 text-warning border-warning/20',
        icon: React.createElement(Award, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (busFilter !== 'all') {
      chips.push({
        key: 'bus',
        label: busFilter,
        onRemove: () => setBusFilter('all'),
        colorClass: 'bg-primary/10 text-teal-700 border-teal-200',
        icon: React.createElement(Bus, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (routeFilter !== 'all') {
      chips.push({
        key: 'route',
        label: routeFilter,
        onRemove: () => setRouteFilter('all'),
        colorClass: 'bg-primary/10 text-indigo-700 border-indigo-200',
        icon: React.createElement(MapPin, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    return chips;
  }, [dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter, filterOptions]);

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
    activeChips,
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
