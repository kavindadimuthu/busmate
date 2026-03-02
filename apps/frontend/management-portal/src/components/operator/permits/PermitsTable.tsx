'use client';

import React from 'react';
import { Eye, FileText, AlertTriangle, MapPin } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';
import type { OperatorPermit } from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitsTableProps {
  permits: OperatorPermit[];
  loading: boolean;
  currentSort: SortState;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  onView: (permitId: string) => void;
}

// ── Style maps ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
};

const PERMIT_TYPE_STYLES: Record<string, string> = {
  REGULAR: 'bg-blue-100 text-blue-800 border-blue-200',
  SPECIAL: 'bg-purple-100 text-purple-800 border-purple-200',
  TEMPORARY: 'bg-orange-100 text-orange-800 border-orange-200',
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

// ── Empty state ───────────────────────────────────────────────────

function EmptyPermits() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileText className="w-12 h-12 text-gray-300 mb-3" />
      <h3 className="text-base font-semibold text-gray-900 mb-1">No permits found</h3>
      <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function PermitsTable({ permits, loading, currentSort, onSort, onView }: PermitsTableProps) {
  const columns: DataTableColumn<OperatorPermit>[] = [
    {
      key: 'permitNumber',
      header: 'Permit Number',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {row.permitNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'routeGroupName',
      header: 'Route Group',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {row.routeGroupName}
            </p>
            {row.routeGroupCode && (
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                {row.routeGroupCode}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'permitType',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          PERMIT_TYPE_STYLES[row.permitType] ?? 'bg-gray-100 text-gray-700 border-gray-200'
        }`}>
          {row.permitType.charAt(0) + row.permitType.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
        }`}>
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.issueDate)}</span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      render: (row) => {
        const expired = isExpired(row.expiryDate);
        const expiringSoon = !expired && isExpiringSoon(row.expiryDate);
        return (
          <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`text-sm ${
                expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'
              }`}>
                {formatDate(row.expiryDate)}
              </span>
              {(expired || expiringSoon) && (
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${expired ? 'text-red-500' : 'text-orange-500'}`}
                  aria-label={expired ? 'Expired' : 'Expiring soon'}
                />
              )}
            </div>
            {expiringSoon && <p className="text-xs text-orange-600 mt-0.5">Expiring soon</p>}
            {expired && <p className="text-xs text-red-600 mt-0.5">Expired</p>}
          </div>
        );
      },
    },
    {
      key: 'maximumBusAssigned',
      header: 'Max Buses',
      cellClassName: 'text-center',
      headerClassName: 'text-center',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.maximumBusAssigned}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center whitespace-nowrap',
      render: (row) => (
        <button
          onClick={() => onView(row.id)}
          title="View permit details"
          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={permits}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(row) => row.id}
      emptyState={<EmptyPermits />}
      showRefreshing
    />
  );
}
