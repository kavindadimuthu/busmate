'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { TicketStatsCards, TicketFilterBar, TicketTable, TicketDetailModal } from '@/components/shared/tickets';
import { useMotTickets } from '@/hooks/mot/tickets/useMotTickets';

export default function MotTicketsPage() {
  useSetPageMetadata({
    title: 'Tickets',
    description: 'View and search all tickets issued across every operator',
    activeItem: 'tickets',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Tickets' }],
  });

  const {
    state, tickets, totalItems, stats, isLoading, statsLoading, error,
    activeFilterCount, setPage, setPageSize, setSort, setSearch, setFilters,
    clearFilters, handleRefresh, detailModal, loadTickets,
  } = useMotTickets();

  useSetPageActions(
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>,
  );

  return (
    <div className="space-y-6">
      <TicketStatsCards stats={stats} loading={statsLoading} />

      <TicketFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 text-sm text-destructive">
          <div className="flex-1">
            <span className="font-semibold">Error: </span>{error}
          </div>
          <button onClick={loadTickets} className="shrink-0 underline hover:no-underline text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <TicketTable
        data={tickets} totalItems={totalItems} page={state.page} pageSize={state.pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn} sortDirection={state.sortDirection}
        onSort={setSort} loading={isLoading} onView={detailModal.open}
      />

      <TicketDetailModal open={detailModal.isOpen} onOpenChange={detailModal.setOpen} ticket={detailModal.data} />
    </div>
  );
}
