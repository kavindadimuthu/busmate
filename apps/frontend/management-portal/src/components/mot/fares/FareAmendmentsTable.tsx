'use client';

import React from 'react';
import { Eye, Calendar, FileText, Hash } from 'lucide-react';
import {
  FareAmendmentSummary,
  AmendmentStatus,
  AMENDMENT_STATUS_COLORS,
} from '@/data/mot/fares';
import { DataTable, DataTableColumn, SortState } from '@/components/shared/DataTable';

interface FareAmendmentsTableProps {
  amendments: FareAmendmentSummary[];
  onView: (amendmentId: string) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  currentSort: SortState;
  loading?: boolean;
}

export function FareAmendmentsTable({
  amendments,
  onView,
  onSort,
  currentSort,
  loading,
}: FareAmendmentsTableProps) {
  const columns: DataTableColumn<FareAmendmentSummary>[] = [
    {
      key: 'referenceNumber',
      header: 'Reference',
      sortable: true,
      minWidth: 'min-w-[170px]',
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{row.referenceNumber}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      minWidth: 'min-w-[200px]',
      render: (row) => (
        <span className="text-sm text-foreground line-clamp-1">{row.title}</span>
      ),
    },
    {
      key: 'effectiveDate',
      header: 'Effective Date',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-foreground/80">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
          {new Date(row.effectiveDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: 'gazetteNumber',
      header: 'Gazette No.',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.gazetteNumber || '—'}
        </span>
      ),
    },
    {
      key: 'maxStages',
      header: 'Stages',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-foreground/80">
          <Hash className="w-3.5 h-3.5 text-muted-foreground/70" />
          {row.maxStages}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            AMENDMENT_STATUS_COLORS[row.status] || 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center whitespace-nowrap',
      render: (row) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(row.id)}
            className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors duration-100"
            title="View fare matrix"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable<FareAmendmentSummary>
      columns={columns}
      data={amendments}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(row) => row.id}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary/70" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No amendments found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            No fare amendments match your search criteria. Try adjusting your filters.
          </p>
        </div>
      }
    />
  );
}
