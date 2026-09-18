'use client';

import { Eye, FileText, MapPin, Bus } from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { PassengerServicePermitResponse } from '@busmate/api-client-core';
import { ToneBadge } from '@/components/shared/form-primitives';
import { TONE_CLASSES, formatDate, permitState, permitTypeLabel } from '@/lib/permits';

interface PermitsTableProps
  extends Pick<
    DataTableProps<PassengerServicePermitResponse>,
    'page' | 'pageSize' | 'onPageChange' | 'onPageSizeChange' | 'sortColumn' | 'sortDirection' | 'onSort' | 'loading'
  > {
  permits: PassengerServicePermitResponse[];
  totalItems: number;
  onView: (permitId: string) => void;
  /** Show the operator column (MOT views list every operator's permits). */
  showOperator?: boolean;
}

export function PermitsTable({ permits, totalItems, onView, showOperator = false, ...table }: PermitsTableProps) {
  const columns: ColumnDef<PassengerServicePermitResponse>[] = [
    {
      id: 'permitNumber',
      header: 'Permit Number',
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{row.permitNumber}</p>
        </div>
      ),
    },
    ...(showOperator
      ? [{
          id: 'operatorName',
          header: 'Operator',
          cell: ({ row }: { row: PassengerServicePermitResponse }) => (
            <span className="text-sm text-foreground">{row.operatorName}</span>
          ),
        } as ColumnDef<PassengerServicePermitResponse>]
      : []),
    {
      id: 'routeGroupName',
      header: 'Route Group',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="text-sm text-foreground truncate">{row.routeGroupName}</span>
        </div>
      ),
    },
    {
      id: 'permitType',
      header: 'Type',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{permitTypeLabel(row.permitType)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: ({ row }) => {
        const state = permitState(row);
        return <ToneBadge className={TONE_CLASSES[state.tone]}>{state.label}</ToneBadge>;
      },
    },
    {
      id: 'expiryDate',
      header: 'Valid Until',
      sortable: true,
      cell: ({ row }) => (
        <span className={`text-sm whitespace-nowrap ${row.expired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {row.expiryDate ? formatDate(row.expiryDate) : 'No expiry'}
        </span>
      ),
    },
    {
      id: 'buses',
      header: 'Buses',
      align: 'center',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Bus className="w-3.5 h-3.5" />
          {row.activeBusCount ?? 0} / {row.maximumBusAssigned}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'center',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (row.id) onView(row.id);
          }}
          title="View permit"
          aria-label={`View permit ${row.permitNumber}`}
          className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <DataTable<PassengerServicePermitResponse>
      columns={columns}
      data={permits}
      totalItems={totalItems}
      getRowId={(row) => row.id ?? row.permitNumber ?? ""}
      onRowClick={(row) => row.id && onView(row.id)}
      emptyState={
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No permits found"
          description="Add the passenger service permits you hold, or adjust the filters."
        />
      }
      {...table}
    />
  );
}
