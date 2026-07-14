'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDataTable, useDialog } from '@busmate/ui';
import { TicketControllerService } from '@busmate/api-client-ticketing';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';
import { BusOperatorOperationsService } from '@busmate/api-client-route';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import type { TicketFilters } from '@/components/shared/tickets';
import type { TicketStatistics } from '@/components/shared/tickets';

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

/**
 * ticketing-service's Tickets entity has no operatorId (busId is a bare string, no FK) - so
 * "this operator's tickets" is resolved by first fetching the operator's own bus ids (already
 * real, via BusOperatorOperationsService) and passing them as the busIds filter on the real
 * admin ticket-listing endpoint. Same client-side-scoping approach already used for Fleet/Crew.
 */
export function useOperatorTickets() {
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<TicketFilters>({
      initialPageSize: 10,
      initialSort: { column: 'issuedAt', direction: 'desc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [myBusIds, setMyBusIds] = useState<string[] | null>(null);
  const [tickets, setTickets] = useState<ConductorLogTicketDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<TicketStatistics>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detailModal = useDialog<ConductorLogTicketDTO>();

  const loadMyBusIds = useCallback(async () => {
    if (!operator?.id) return;
    try {
      const result = await BusOperatorOperationsService.getOperatorBuses(operator.id, 0, 100);
      setMyBusIds((result.content ?? []).map((b) => b.id!).filter(Boolean));
    } catch (err) {
      console.error('Error loading operator buses for ticket scoping:', err);
      setMyBusIds([]);
    }
  }, [operator?.id]);

  useEffect(() => {
    loadMyBusIds();
  }, [loadMyBusIds]);

  const loadStatistics = useCallback(async () => {
    if (!myBusIds || myBusIds.length === 0) {
      setStats(EMPTY_STATS);
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const result = await TicketControllerService.getAllTickets(0, 200, 'issuedAt', 'desc', myBusIds);
      const all = result.content ?? [];
      setStats({
        totalTickets: all.length,
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
  }, [myBusIds]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadTickets = useCallback(async () => {
    if (!myBusIds) return;
    if (myBusIds.length === 0) {
      setTickets([]);
      setTotalItems(0);
      setIsLoading(false);
      return;
    }
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
        myBusIds,
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
  }, [myBusIds, state.page, state.pageSize, state.sortColumn, state.sortDirection, state.searchQuery, state.filters]);

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
    isLoading: isLoading || operatorLoading,
    statsLoading,
    error: error ?? operatorError,
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
