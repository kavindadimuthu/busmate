import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
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
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import type { TabItem } from '@/components/shared/SwitchableTabs';
import { BarChart3, Bus, CreditCard, MapPin, Ticket, Users } from 'lucide-react';

// ── Tab configuration ─────────────────────────────────────────────

export type RevenueTab = 'overview' | 'tickets';

export const REVENUE_TABS: TabItem<RevenueTab>[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tickets', label: 'All Tickets', icon: Ticket },
];

// ── Filter select config type ─────────────────────────────────────

export type FilterSelectConfig = {
  key: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
  icon?: React.ReactNode;
  activeColorClass?: string;
};

// ── Hook ──────────────────────────────────────────────────────────

export function useRevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [allTickets, setAllTickets] = useState<TicketRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<RevenueFilterOptions | null>(null);

  const [activeTab, setActiveTab] = useState<RevenueTab>('overview');

  const [searchTerm, setSearchTerm] = useState('');
  const [busFilter, setBusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [conductorFilter, setConductorFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

    if (busFilter !== 'all') tickets = tickets.filter((t) => t.busId === busFilter);
    if (routeFilter !== 'all') tickets = tickets.filter((t) => t.routeId === routeFilter);
    if (conductorFilter !== 'all') tickets = tickets.filter((t) => t.conductorId === conductorFilter);
    if (paymentFilter !== 'all') tickets = tickets.filter((t) => t.paymentMethod === paymentFilter);
    if (statusFilter !== 'all') tickets = tickets.filter((t) => t.status === statusFilter);

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

  const handleSearchChange = useCallback((v: string) => {
    setSearchTerm(v);
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
      {
        key: 'conductor',
        value: conductorFilter,
        onChange: (v: string) => { setConductorFilter(v); setCurrentPage(0); },
        options: filterOptions.conductors,
        allLabel: 'All Conductors',
        icon: React.createElement(Users, { className: 'h-3.5 w-3.5' }),
      },
      {
        key: 'payment',
        value: paymentFilter,
        onChange: (v: string) => { setPaymentFilter(v); setCurrentPage(0); },
        options: filterOptions.paymentMethods,
        allLabel: 'All Payment Methods',
        icon: React.createElement(CreditCard, { className: 'h-3.5 w-3.5' }),
      },
      {
        key: 'status',
        value: statusFilter,
        onChange: (v: string) => { setStatusFilter(v); setCurrentPage(0); },
        options: filterOptions.statuses,
        allLabel: 'All Statuses',
      },
    ];
  }, [filterOptions, dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter]);

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

    if (busFilter !== 'all') {
      const bus = filterOptions?.buses.find((b) => b.value === busFilter);
      chips.push({
        key: 'bus',
        label: bus?.label ?? busFilter,
        onRemove: () => setBusFilter('all'),
        colorClass: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]',
        icon: React.createElement(Bus, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (routeFilter !== 'all') {
      const route = filterOptions?.routes.find((r) => r.value === routeFilter);
      chips.push({
        key: 'route',
        label: route?.label ?? routeFilter,
        onRemove: () => setRouteFilter('all'),
        colorClass: 'bg-primary/10 text-teal-700 border-teal-200',
        icon: React.createElement(MapPin, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (conductorFilter !== 'all') {
      const cond = filterOptions?.conductors.find((c) => c.value === conductorFilter);
      chips.push({
        key: 'conductor',
        label: cond?.label ?? conductorFilter,
        onRemove: () => setConductorFilter('all'),
        colorClass: 'bg-warning/10 text-warning border-warning/20',
        icon: React.createElement(Users, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (paymentFilter !== 'all') {
      const pm = filterOptions?.paymentMethods.find((p) => p.value === paymentFilter);
      chips.push({
        key: 'payment',
        label: pm?.label ?? paymentFilter,
        onRemove: () => setPaymentFilter('all'),
        colorClass: 'bg-success/10 text-success border-success/20',
        icon: React.createElement(CreditCard, { className: 'h-3 w-3 opacity-70' }),
      });
    }

    if (statusFilter !== 'all') {
      const st = filterOptions?.statuses.find((s) => s.value === statusFilter);
      chips.push({
        key: 'status',
        label: st?.label ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-destructive/10 text-destructive border-destructive/20',
      });
    }

    return chips;
  }, [dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter, filterOptions]);

  return {
    activeTab,
    setActiveTab,
    loading,
    allTickets,
    sortedTickets,
    paginatedTickets,
    totalPages,
    kpis,
    busByRevenue,
    routeByRevenue,
    conductorByRevenue,
    paymentByRevenue,
    dailySummaries,
    sort,
    currentPage,
    setCurrentPage,
    pageSize,
    searchTerm,
    filterSelectConfigs,
    activeChips,
    handleSort,
    handlePageSizeChange,
    handleSearchChange,
    handleClearAllFilters,
    handleExport,
    loadData,
  };
}
