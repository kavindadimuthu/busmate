'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  MapPin,
  Settings,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

interface PermitsTableProps {
  permits: any[];
  onView: (permitId: string) => void;
  onEdit: (permitId: string) => void;
  onDelete: (permitId: string, permitNumber: string) => void;
  onAssignBus?: (permitId: string, permitNumber: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  activeFilters: Record<string, any>;
  loading: boolean;
  currentSort: SortState;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success border-success/20',
  INACTIVE: 'bg-destructive/15 text-destructive border-destructive/20',
  PENDING: 'bg-warning/15 text-warning border-warning/20',
  EXPIRED: 'bg-muted text-foreground border-border',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-3.5 h-3.5" />,
  INACTIVE: <XCircle className="w-3.5 h-3.5" />,
  PENDING: <Clock className="w-3.5 h-3.5" />,
  EXPIRED: <XCircle className="w-3.5 h-3.5" />,
};

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0;
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

function getExpiryClassName(expiryDate?: string): string {
  if (isExpired(expiryDate)) return 'text-destructive';
  if (isExpiringSoon(expiryDate)) return 'text-warning';
  return 'text-foreground';
}

// ── Component ─────────────────────────────────────────────────────

export function PermitsTable({
  permits,
  onView,
  onEdit,
  onDelete,
  onAssignBus,
  onSort,
  activeFilters,
  loading,
  currentSort,
}: PermitsTableProps) {
  const columns = useMemo<DataTableColumn<any>[]>(
    () => [
      {
        key: 'permitNumber',
        header: 'Permit Number',
        sortable: true,
        minWidth: 'min-w-[160px]',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {row.permitNumber || 'N/A'}
            </span>
          </div>
        ),
      },
      {
        key: 'operatorName',
        header: 'Operator',
        sortable: true,
        minWidth: 'min-w-[140px]',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-sm text-foreground">{row.operatorName || 'Unknown'}</span>
          </div>
        ),
      },
      {
        key: 'routeGroupName',
        header: 'Route Group',
        sortable: true,
        minWidth: 'min-w-[140px]',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-sm text-foreground">{row.routeGroupName || 'N/A'}</span>
          </div>
        ),
      },
      {
        key: 'permitType',
        header: 'Type',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-foreground">{row.permitType || 'N/A'}</span>
        ),
      },
      {
        key: 'maximumBusAssigned',
        header: 'Max Buses',
        sortable: true,
        render: (row) => (
          <span className="text-sm font-semibold text-foreground">
            {row.maximumBusAssigned || 0}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => {
          const s = (row.status ?? '').toUpperCase();
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                STATUS_STYLES[s] ?? 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {STATUS_ICONS[s] ?? <AlertTriangle className="w-3.5 h-3.5" />}
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'Unknown'}
            </span>
          );
        },
      },
      {
        key: 'expiryDate',
        header: 'Expiry Date',
        sortable: true,
        render: (row) => (
          <div>
            <span className={`text-xs ${getExpiryClassName(row.expiryDate)}`}>
              {formatDate(row.expiryDate)}
            </span>
            {isExpiringSoon(row.expiryDate) && !isExpired(row.expiryDate) && (
              <div className="flex items-center gap-0.5 text-xs text-warning mt-0.5">
                <AlertTriangle className="h-3 w-3" />
                Expiring Soon
              </div>
            )}
            {isExpired(row.expiryDate) && (
              <div className="flex items-center gap-0.5 text-xs text-destructive mt-0.5">
                <XCircle className="h-3 w-3" />
                Expired
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        render: (row) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(row.id)}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            {onAssignBus && (
              <button
                onClick={() => onAssignBus(row.id, row.permitNumber || 'Unknown')}
                className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                title="Assign Bus"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(row.id, row.permitNumber || 'Unknown')}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete, onAssignBus],
  );

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable
      columns={columns}
      data={permits}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(row) => row.id}
      showRefreshing={loading && permits.length > 0}
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary/70" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No permits found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {hasActiveFilters
              ? 'No permits match your current filters. Try adjusting your search criteria.'
              : 'No permits have been issued yet.'}
          </p>
        </div>
      }
    />
  );
}
