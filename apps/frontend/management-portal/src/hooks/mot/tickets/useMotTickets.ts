'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDataTable, useDialog } from '@busmate/ui';
import { TicketControllerService } from '@busmate/api-client-ticketing';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';
import type { TicketFilters, TicketStatistics } from '@/components/shared/tickets';

const INITIAL_FILTERS: TicketFilters = {
  bookingStatus: '__all__',
  issueMethod: '__all__',
  fromDate: '',
  toDate: '',
};

const EMPTY_STATS: TicketStatistics = {
  totalTickets: 0, boardedTickets: 0, confirmedTickets: 0,
  pendingPaymentTickets: 0, cancelledTickets: 0, totalRevenue: 0,
};

/** MOT is a regulator view - no operator scoping, calls the admin ticket-listing endpoint unfiltered by busIds. */
export function useMotTickets() {
  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<TicketFilters>({
      initialPageSize: 10,
      initialSort: { column: 'issuedAt', direction: 'desc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [tickets, setTickets] = useState<ConductorLogTicketDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<TicketStatistics>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detailModal = useDialog<ConductorLogTicketDTO>();

  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await TicketControllerService.getAllTickets(0, 200, 'issuedAt', 'desc');
      const all = result.content ?? [];
      setStats({
        totalTickets: result.totalElements ?? all.length,
        boardedTickets: all.filter((t) => t.bookingStatus === 'BOARDED').length,
        confirmedTickets: all.filter((t) => t.bookingStatus === 'CONFIRMED').length,
        pendingPaymentTickets: all.filter((t) => t.bookingStatus === 'PENDING_PAYMENT').length,
        cancelledTickets: all.filter((t) => t.bookingStatus === 'CANCELLED').length,
        totalRevenue: all
          .filter((t) => t.bookingStatus === 'BOARDED' || t.bookingStatus === 'CONFIRMED')
          .reduce((sum, t) => sum + (t.fareAmount ?? 0), 0),
      });
    } catch (err) {
      console.error('Error loading ticket statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = state.filters.bookingStatus === '__all__' ? undefined : state.filters.bookingStatus;
      const method = state.filters.issueMethod === '__all__' ? undefined : state.filters.issueMethod;
      const result = await TicketControllerService.getAllTickets(
        state.page - 1,
        state.pageSize,
        state.sortColumn ?? 'issuedAt',
        state.sortDirection ?? 'desc',
        undefined,
        undefined,
        undefined,
        undefined,
        method,
        status,
        state.filters.fromDate || undefined,
        state.filters.toDate || undefined,
        state.searchQuery || undefined,
      );
      setTickets(result.content ?? []);
      setTotalItems(result.totalElements ?? 0);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state.page, state.pageSize, state.sortColumn, state.sortDirection, state.searchQuery, state.filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadTickets()]);
  }, [loadStatistics, loadTickets]);

  const activeFilterCount =
    (state.filters.bookingStatus !== '__all__' ? 1 : 0) +
    (state.filters.issueMethod !== '__all__' ? 1 : 0) +
    (state.filters.fromDate ? 1 : 0) +
    (state.filters.toDate ? 1 : 0);

  return {
    state,
    tickets,
    totalItems,
    stats,
    isLoading,
    statsLoading,
    error,
    activeFilterCount,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    handleRefresh,
    detailModal,
    loadTickets,
  };
}
