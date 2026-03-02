'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { SwitchableTabs, type TabItem } from '@/components/shared/SwitchableTabs';
import { SearchFilterBar, type FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import { SelectFilter } from '@/components/shared/SearchFilterBar';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  RevenueStatsCards,
  RevenueBreakdownPanel,
  RevenueTicketsTable,
  RevenueTrendsChart,
  RevenueActionButtons,
} from '@/components/operator/revenue-analytics';
import {
  getAllTickets,
  computeRevenueKPIs,
  getRevenueBreakdown,
  getDailyRevenueSummaries,
  getRevenueFilterOptions,
  type TicketRecord,
  type RevenueKPISummary,
  type RevenueBreakdownItem,
  type DailyRevenueSummary,
  type RevenueFilterOptions,
} from '@/data/operator/revenue';
import type { SortState } from '@/components/shared/DataTable';
import {
  BarChart3,
  CreditCard,
  Bus,
  MapPin,
  Users,
  Ticket,
} from 'lucide-react';

// ── Tab configuration ─────────────────────────────────────────────

type RevenueTab = 'overview' | 'tickets';

const REVENUE_TABS: TabItem<RevenueTab>[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tickets', label: 'All Tickets', icon: Ticket },
];

// ── Main Page Component ───────────────────────────────────────────

export default function RevenueAnalyticsPage() {
  // ── Page metadata ───────────────────────────────────────────────
  useSetPageMetadata({
    title: 'Revenue Analytics',
    description: 'Track ticket sales, revenue breakdowns, and financial performance across your fleet',
    activeItem: 'revenue-analytics',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Revenue Analytics' }],
  });

  // ── Loading & data state ────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [allTickets, setAllTickets] = useState<TicketRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<RevenueFilterOptions | null>(null);

  // ── View state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<RevenueTab>('overview');

  // ── Filter state ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [busFilter, setBusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [conductorFilter, setConductorFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'today', '7d', '30d', 'all'

  // ── Sort & pagination state (tickets tab) ───────────────────────
  const [sort, setSort] = useState<SortState>({ field: 'issueDateTime', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // ── Load data ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tickets = await getAllTickets();
      setAllTickets(tickets);
      setFilterOptions(getRevenueFilterOptions());
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered tickets ────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    let tickets = allTickets;

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
      tickets = tickets.filter((t) => t.issueDateTime.split('T')[0] >= startStr);
    }

    // Dropdown filters
    if (busFilter !== 'all') tickets = tickets.filter((t) => t.busId === busFilter);
    if (routeFilter !== 'all') tickets = tickets.filter((t) => t.routeId === routeFilter);
    if (conductorFilter !== 'all') tickets = tickets.filter((t) => t.conductorId === conductorFilter);
    if (paymentFilter !== 'all') tickets = tickets.filter((t) => t.paymentMethod === paymentFilter);
    if (statusFilter !== 'all') tickets = tickets.filter((t) => t.status === statusFilter);

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      tickets = tickets.filter((t) =>
        t.ticketId.toLowerCase().includes(term) ||
        t.busNumber.toLowerCase().includes(term) ||
        t.routeName.toLowerCase().includes(term) ||
        t.conductorName.toLowerCase().includes(term) ||
        t.pickupLocation.toLowerCase().includes(term) ||
        t.dropOffLocation.toLowerCase().includes(term),
      );
    }

    return tickets;
  }, [allTickets, dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter, searchTerm]);

  // ── Sorted tickets ──────────────────────────────────────────────
  const sortedTickets = useMemo(() => {
    if (!sort.field) return filteredTickets;

    return [...filteredTickets].sort((a, b) => {
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
  }, [filteredTickets, sort]);

  // ── Paginated tickets ───────────────────────────────────────────
  const paginatedTickets = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedTickets.slice(start, start + pageSize);
  }, [sortedTickets, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedTickets.length / pageSize) || 1;

  // ── Computed analytics ──────────────────────────────────────────
  const kpis: RevenueKPISummary | null = useMemo(
    () => (filteredTickets.length > 0 ? computeRevenueKPIs(filteredTickets) : null),
    [filteredTickets],
  );

  const busByRevenue: RevenueBreakdownItem[] = useMemo(
    () => getRevenueBreakdown(filteredTickets, 'bus'),
    [filteredTickets],
  );

  const routeByRevenue: RevenueBreakdownItem[] = useMemo(
    () => getRevenueBreakdown(filteredTickets, 'route'),
    [filteredTickets],
  );

  const conductorByRevenue: RevenueBreakdownItem[] = useMemo(
    () => getRevenueBreakdown(filteredTickets, 'conductor'),
    [filteredTickets],
  );

  const paymentByRevenue: RevenueBreakdownItem[] = useMemo(
    () => getRevenueBreakdown(filteredTickets, 'paymentMethod'),
    [filteredTickets],
  );

  const dailySummaries: DailyRevenueSummary[] = useMemo(
    () => getDailyRevenueSummaries(filteredTickets),
    [filteredTickets],
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
    setBusFilter('all');
    setRouteFilter('all');
    setConductorFilter('all');
    setPaymentFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(0);
  }, []);

  const handleExport = useCallback(() => {
    alert('Generating revenue report...');
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

    if (busFilter !== 'all') {
      const bus = filterOptions?.buses.find((b) => b.value === busFilter);
      chips.push({
        key: 'bus',
        label: bus?.label ?? busFilter,
        onRemove: () => setBusFilter('all'),
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Bus className="h-3 w-3 opacity-70" />,
      });
    }

    if (routeFilter !== 'all') {
      const route = filterOptions?.routes.find((r) => r.value === routeFilter);
      chips.push({
        key: 'route',
        label: route?.label ?? routeFilter,
        onRemove: () => setRouteFilter('all'),
        colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: <MapPin className="h-3 w-3 opacity-70" />,
      });
    }

    if (conductorFilter !== 'all') {
      const cond = filterOptions?.conductors.find((c) => c.value === conductorFilter);
      chips.push({
        key: 'conductor',
        label: cond?.label ?? conductorFilter,
        onRemove: () => setConductorFilter('all'),
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Users className="h-3 w-3 opacity-70" />,
      });
    }

    if (paymentFilter !== 'all') {
      const pm = filterOptions?.paymentMethods.find((p) => p.value === paymentFilter);
      chips.push({
        key: 'payment',
        label: pm?.label ?? paymentFilter,
        onRemove: () => setPaymentFilter('all'),
        colorClass: 'bg-green-50 text-green-700 border-green-200',
        icon: <CreditCard className="h-3 w-3 opacity-70" />,
      });
    }

    if (statusFilter !== 'all') {
      const st = filterOptions?.statuses.find((s) => s.value === statusFilter);
      chips.push({
        key: 'status',
        label: st?.label ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-red-50 text-red-700 border-red-200',
      });
    }

    return chips;
  }, [dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter, filterOptions]);

  // ── Page actions ────────────────────────────────────────────────
  useSetPageActions(
    <RevenueActionButtons
      onExport={handleExport}
      onRefresh={loadData}
      isLoading={loading}
    />,
  );

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <SwitchableTabs<RevenueTab>
        tabs={REVENUE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI stats row */}
      <RevenueStatsCards kpis={kpis} loading={loading} />

      {/* Filters */}
      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(0); }}
        searchPlaceholder="Search tickets by ID, bus, route, conductor, location..."
        totalCount={allTickets.length}
        filteredCount={sortedTickets.length}
        loadedCount={paginatedTickets.length}
        resultLabel="ticket"
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
              <SelectFilter
                value={conductorFilter}
                onChange={(v) => { setConductorFilter(v); setCurrentPage(0); }}
                options={filterOptions.conductors}
                allLabel="All Conductors"
                icon={<Users className="h-3.5 w-3.5" />}
              />
              <SelectFilter
                value={paymentFilter}
                onChange={(v) => { setPaymentFilter(v); setCurrentPage(0); }}
                options={filterOptions.paymentMethods}
                allLabel="All Payment Methods"
                icon={<CreditCard className="h-3.5 w-3.5" />}
              />
              <SelectFilter
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}
                options={filterOptions.statuses}
                allLabel="All Statuses"
              />
            </>
          ) : undefined
        }
        activeChips={activeChips}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* ── Overview tab content ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Trends chart */}
          <RevenueTrendsChart data={dailySummaries} loading={loading} />

          {/* Breakdown panels — 2-column grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RevenueBreakdownPanel
              title="Revenue by Bus"
              data={busByRevenue}
              loading={loading}
            />
            <RevenueBreakdownPanel
              title="Revenue by Route"
              data={routeByRevenue}
              loading={loading}
            />
            <RevenueBreakdownPanel
              title="Revenue by Conductor"
              data={conductorByRevenue}
              loading={loading}
            />
            <RevenueBreakdownPanel
              title="Revenue by Payment Method"
              data={paymentByRevenue}
              loading={loading}
              maxItems={4}
            />
          </div>
        </>
      )}

      {/* ── Tickets tab content ──────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <>
          <RevenueTicketsTable
            data={paginatedTickets}
            loading={loading}
            currentSort={sort}
            onSort={handleSort}
          />
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={sortedTickets.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
