'use client';

import React from 'react';
import { Eye, FileText, AlertTriangle, MapPin } from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { OperatorPermit } from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitsTableProps
  extends Pick<
    DataTableProps<any>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  permits: OperatorPermit[];
  totalItems: number;
  onView: (permitId: string) => void;
}

// ── Style maps ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success border-success/20',
  INACTIVE: 'bg-muted text-foreground/80 border-border',
  PENDING: 'bg-warning/15 text-warning border-warning/20',
  EXPIRED: 'bg-destructive/15 text-destructive border-destructive/20',
};

const PERMIT_TYPE_STYLES: Record<string, string> = {
  REGULAR: 'bg-primary/15 text-primary border-primary/20',
  SPECIAL: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))] border-[hsl(var(--purple-200))]',
  TEMPORARY: 'bg-warning/15 text-warning border-orange-200',
};

// ── Date helpers ──────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0;
}

// ── Component ─────────────────────────────────────────────────────

export function PermitsTable({ permits, totalItems, page, pageSize, onPageChange, onPageSizeChange, sortColumn, sortDirection, onSort, loading, onView }: PermitsTableProps) {
  const columns: ColumnDef<OperatorPermit>[] = [
    {
      id: 'permitNumber',
      header: 'Permit Number',
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-blue-200/60">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {row.permitNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'routeGroupName',
      header: 'Route Group',
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {row.routeGroupName}
            </p>
            {row.routeGroupCode && (
              <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                {row.routeGroupCode}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'permitType',
      header: 'Type',
      sortable: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          PERMIT_TYPE_STYLES[row.permitType] ?? 'bg-muted text-foreground/80 border-border'
        }`}>
          {row.permitType.charAt(0) + row.permitType.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          STATUS_STYLES[row.status] ?? 'bg-muted text-foreground/80 border-border'
        }`}>
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      id: 'issueDate',
      header: 'Issue Date',
      sortable: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(row.issueDate)}</span>
      ),
    },
    {
      id: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      cell: ({ row }) => {
        const expired = isExpired(row.expiryDate);
        const expiringSoon = !expired && isExpiringSoon(row.expiryDate);
        return (
          <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`text-sm ${
                expired ? 'text-destructive font-medium' : expiringSoon ? 'text-warning font-medium' : 'text-muted-foreground'
              }`}>
                {formatDate(row.expiryDate)}
              </span>
              {(expired || expiringSoon) && (
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${expired ? 'text-destructive/80' : 'text-warning/80'}`}
                  aria-label={expired ? 'Expired' : 'Expiring soon'}
                />
              )}
            </div>
            {expiringSoon && <p className="text-xs text-warning mt-0.5">Expiring soon</p>}
            {expired && <p className="text-xs text-destructive mt-0.5">Expired</p>}
          </div>
        );
      },
    },
    {
      id: 'maximumBusAssigned',
      header: 'Max Buses',
      align: 'center',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.maximumBusAssigned}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'center',
      cell: ({ row }) => (
        <button
          onClick={() => onView(row.id)}
          title="View permit details"
          className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors duration-100"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <DataTable<OperatorPermit>
      columns={columns}
      data={permits}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(row) => row.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No permits found"
          description="Try adjusting your search or filters."
        />
      }
    />
  );
}
