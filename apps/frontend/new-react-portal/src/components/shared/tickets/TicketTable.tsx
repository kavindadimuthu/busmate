'use client';

import * as React from 'react';
import { Eye, Ticket } from 'lucide-react';
import { DataTable, Button } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';
import { ticketColumns } from './ticketColumns';

interface TicketTableProps
  extends Pick<
    DataTableProps<ConductorLogTicketDTO>,
    'page' | 'pageSize' | 'onPageChange' | 'onPageSizeChange' | 'sortColumn' | 'sortDirection' | 'onSort' | 'loading'
  > {
  data: ConductorLogTicketDTO[];
  totalItems: number;
  onView: (ticket: ConductorLogTicketDTO) => void;
}

export function TicketTable({
  data,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
}: TicketTableProps) {
  const rowActions = React.useCallback(
    (ticket: ConductorLogTicketDTO) => (
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(ticket)} title="View ticket details">
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onView],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="text-base font-semibold mb-1">No tickets found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
    </div>
  );

  return (
    <DataTable<ConductorLogTicketDTO>
      columns={ticketColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      loading={loading}
      getRowId={(ticket) => String(ticket.ticketId)}
      rowActions={rowActions}
      onRowClick={onView}
      emptyState={emptyState}
    />
  );
}
