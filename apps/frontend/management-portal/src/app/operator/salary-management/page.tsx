'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { SwitchableTabs, type TabItem } from '@/components/shared/SwitchableTabs';
import { SearchFilterBar, type FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import { SelectFilter } from '@/components/shared/SearchFilterBar';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  SalaryStatsCards,
  SalaryTable,
  SalaryBreakdownPanel,
  SalaryTrendsChart,
  SalaryRulesPanel,
  SalaryActionButtons,
  SalaryDetailModal,
} from '@/components/operator/salary-mgmt';
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
import {
  BarChart3,
  TableProperties,
  Users,
  Bus,
  MapPin,
  Award,
  Shield,
  BookOpen,
} from 'lucide-react';

// ── Tab configuration ─────────────────────────────────────────────

type SalaryTab = 'overview' | 'records' | 'rules';

const SALARY_TABS: TabItem<SalaryTab>[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'records', label: 'Salary Records', icon: TableProperties },
  { id: 'rules', label: 'Salary Rules', icon: BookOpen },
];

// ── Main Page Component ───────────────────────────────────────────

export default function SalaryManagementPage() {
  // ── Page metadata ───────────────────────────────────────────────
  useSetPageMetadata({
    title: 'Salary Management',
    description: 'Track staff salaries, bonuses, deductions, and payment status across your operation',
    activeItem: 'salary-management',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Salary Management' }],
  });

  // ── Loading & data state ────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<SalaryRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<SalaryFilterOptions | null>(null);

  // ── View state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SalaryTab>('overview');

  // ── Detail modal state ──────────────────────────────────────────
  const [detailRecord, setDetailRecord] = useState<SalaryRecord | null>(null);

  // ── Filter state ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'today', '7d', '30d', 'all'

  // ── Sort & pagination state (records tab) ───────────────────────
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

    // Date filter
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

    // Dropdown filters
    if (roleFilter !== 'all') records = records.filter((r) => r.role === roleFilter);
    if (statusFilter !== 'all') records = records.filter((r) => r.paymentStatus === statusFilter);
    if (performanceFilter !== 'all') records = records.filter((r) => r.performanceRating === performanceFilter);
    if (busFilter !== 'all') records = records.filter((r) => r.busAssigned === busFilter);
    if (routeFilter !== 'all') records = records.filter((r) => r.routeAssigned === routeFilter);

    // Search
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

  // ── Active filter chips ─────────────────────────────────────────
  const activeChips: FilterChipDescriptor[] = useMemo(() => {
    const chips: FilterChipDescriptor[] = [];

    if (dateFilter !== 'all') {
      const labels: Record<string, string> = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' };
      chips.push({
        key: 'date',
        label: labels[dateFilter] ?? dateFilter,
        onRemove: () => setDateFilter('all'),
        colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    if (roleFilter !== 'all') {
      const role = filterOptions?.roles.find((r) => r.value === roleFilter);
      chips.push({
        key: 'role',
        label: role?.label ?? roleFilter,
        onRemove: () => setRoleFilter('all'),
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Shield className="h-3 w-3 opacity-70" />,
      });
    }

    if (statusFilter !== 'all') {
      const st = filterOptions?.statuses.find((s) => s.value === statusFilter);
      chips.push({
        key: 'status',
        label: st?.label ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-green-50 text-green-700 border-green-200',
      });
    }

    if (performanceFilter !== 'all') {
      const perf = filterOptions?.performanceRatings.find((p) => p.value === performanceFilter);
      chips.push({
        key: 'performance',
        label: perf?.label ?? performanceFilter,
        onRemove: () => setPerformanceFilter('all'),
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Award className="h-3 w-3 opacity-70" />,
      });
    }

    if (busFilter !== 'all') {
      chips.push({
        key: 'bus',
        label: busFilter,
        onRemove: () => setBusFilter('all'),
        colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: <Bus className="h-3 w-3 opacity-70" />,
      });
    }

    if (routeFilter !== 'all') {
      chips.push({
        key: 'route',
        label: routeFilter,
        onRemove: () => setRouteFilter('all'),
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <MapPin className="h-3 w-3 opacity-70" />,
      });
    }

    return chips;
  }, [dateFilter, roleFilter, statusFilter, performanceFilter, busFilter, routeFilter, filterOptions]);

  // ── Page actions ────────────────────────────────────────────────
  useSetPageActions(
    <SalaryActionButtons
      onExport={handleExport}
      onRefresh={loadData}
      isLoading={loading}
    />,
  );

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <SwitchableTabs<SalaryTab>
        tabs={SALARY_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI stats row — visible on overview & records tabs */}
      {activeTab !== 'rules' && (
        <SalaryStatsCards stats={stats} loading={loading} />
      )}

      {/* Filters — visible on overview & records tabs */}
      {activeTab !== 'rules' && (
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(0); }}
          searchPlaceholder="Search by staff name, ID, bus number, route..."
          totalCount={allRecords.length}
          filteredCount={sortedRecords.length}
          loadedCount={paginatedRecords.length}
          resultLabel="salary record"
          loading={loading}
          filters={
            filterOptions ? (
              <>
                <SelectFilter
                  value={dateFilter}
                  onChange={(v) => { setDateFilter(v); setCurrentPage(0); }}
                  options={[
                    { value: 'today', label: 'Today' },
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days' },
                  ]}
                  allLabel="All Dates"
                  activeColorClass="bg-blue-50 border-blue-300 text-blue-800"
                />
                <SelectFilter
                  value={roleFilter}
                  onChange={(v) => { setRoleFilter(v); setCurrentPage(0); }}
                  options={filterOptions.roles}
                  allLabel="All Roles"
                  icon={<Shield className="h-3.5 w-3.5" />}
                />
                <SelectFilter
                  value={statusFilter}
                  onChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}
                  options={filterOptions.statuses}
                  allLabel="All Statuses"
                />
                <SelectFilter
                  value={performanceFilter}
                  onChange={(v) => { setPerformanceFilter(v); setCurrentPage(0); }}
                  options={filterOptions.performanceRatings}
                  allLabel="All Performance"
                  icon={<Award className="h-3.5 w-3.5" />}
                />
                <SelectFilter
                  value={busFilter}
                  onChange={(v) => { setBusFilter(v); setCurrentPage(0); }}
                  options={filterOptions.buses}
                  allLabel="All Buses"
                  icon={<Bus className="h-3.5 w-3.5" />}
                />
                <SelectFilter
                  value={routeFilter}
                  onChange={(v) => { setRouteFilter(v); setCurrentPage(0); }}
                  options={filterOptions.routes}
                  allLabel="All Routes"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
              </>
            ) : undefined
          }
          activeChips={activeChips}
          onClearAllFilters={handleClearAllFilters}
        />
      )}

      {/* ── Overview tab content ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Trends chart */}
          <SalaryTrendsChart data={monthlySummaries} loading={loading} />

          {/* Breakdown panel */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SalaryBreakdownPanel records={filteredRecords} loading={loading} />
          </div>
        </>
      )}

      {/* ── Records tab content ──────────────────────────────────── */}
      {activeTab === 'records' && (
        <>
          <SalaryTable
            data={paginatedRecords}
            loading={loading}
            currentSort={sort}
            onSort={handleSort}
            onViewDetail={handleViewDetail}
          />
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={sortedRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </>
      )}

      {/* ── Rules tab content ────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <SalaryRulesPanel />
      )}

      {/* ── Detail modal ─────────────────────────────────────────── */}
      <SalaryDetailModal
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
}
