import { useState, useEffect, useMemo, useCallback } from 'react';
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

// ── Tab configuration ─────────────────────────────────────────────

export type RevenueTab = 'overview' | 'tickets';

// ── Filter select config type ─────────────────────────────────────

export type FilterSelectConfig = {
  key: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
};

// ── Hook ──────────────────────────────────────────────────────────

export function useRevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [allTickets, setAllTickets] = useState<TicketRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<RevenueFilterOptions | null>(null);

  const [activeTab, setActiveTab] = useState<RevenueTab>('overview');

  const [searchTerm, setSearchTerm] = useState('');
  const [busFilter, setBusFilter] = useState('__all__');
  const [routeFilter, setRouteFilter] = useState('__all__');
  const [conductorFilter, setConductorFilter] = useState('__all__');
  const [paymentFilter, setPaymentFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [dateFilter, setDateFilter] = useState('__all__');

  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'issueDateTime', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
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
      tickets = tickets.filter((t) => t.issueDateTime.split('T')[0] >= startStr);
    }

    if (busFilter !== '__all__') tickets = tickets.filter((t) => t.busId === busFilter);
    if (routeFilter !== '__all__') tickets = tickets.filter((t) => t.routeId === routeFilter);
    if (conductorFilter !== '__all__') tickets = tickets.filter((t) => t.conductorId === conductorFilter);
    if (paymentFilter !== '__all__') tickets = tickets.filter((t) => t.paymentMethod === paymentFilter);
    if (statusFilter !== '__all__') tickets = tickets.filter((t) => t.status === statusFilter);

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
    const start = (currentPage - 1) * pageSize;
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
    setBusFilter('__all__');
    setRouteFilter('__all__');
    setConductorFilter('__all__');
    setPaymentFilter('__all__');
    setStatusFilter('__all__');
    setDateFilter('__all__');
    setCurrentPage(1);
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
        onChange: (v: string) => { setDateFilter(v); setCurrentPage(1); },
        options: [
          { value: 'today', label: 'Today' },
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
        ],
        label: 'Dates',
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
      {
        key: 'conductor',
        value: conductorFilter,
        onChange: (v: string) => { setConductorFilter(v); setCurrentPage(1); },
        options: filterOptions.conductors,
        label: 'Conductors',
      },
      {
        key: 'payment',
        value: paymentFilter,
        onChange: (v: string) => { setPaymentFilter(v); setCurrentPage(1); },
        options: filterOptions.paymentMethods,
        label: 'Methods',
      },
      {
        key: 'status',
        value: statusFilter,
        onChange: (v: string) => { setStatusFilter(v); setCurrentPage(1); },
        options: filterOptions.statuses,
        label: 'Statuses',
      },
    ];
  }, [filterOptions, dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter]);

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    return [dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter]
      .filter((f) => f !== '__all__').length;
  }, [dateFilter, busFilter, routeFilter, conductorFilter, paymentFilter, statusFilter]);

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
    activeFilterCount,
    handleSort,
    handlePageSizeChange,
    handleSearchChange,
    handleClearAllFilters,
    handleExport,
    loadData,
  };
}
