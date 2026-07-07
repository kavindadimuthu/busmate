'use client';

import * as React from 'react';
import { Calendar, Hash } from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';
import { AMENDMENT_STATUS_COLORS } from '@/data/mot/fares';

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export const fareAmendmentsColumns: ColumnDef<any>[] = [
  {
    id: 'referenceNumber',
    header: 'Reference',
    sortable: true,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{row.referenceNumber}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{row.id}</p>
      </div>
    ),
  },
  {
    id: 'title',
    header: 'Title',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm text-foreground line-clamp-1">{row.title}</span>
    ),
  },
  {
    id: 'effectiveDate',
    header: 'Effective Date',
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-foreground/80 whitespace-nowrap">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
        {formatDate(row.effectiveDate)}
      </div>
    ),
  },
  {
    id: 'gazetteNumber',
    header: 'Gazette No.',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
        {row.gazetteNumber || '—'}
      </span>
    ),
  },
  {
    id: 'maxStages',
    header: 'Stages',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-foreground/80 whitespace-nowrap">
        <Hash className="w-3.5 h-3.5 text-muted-foreground/70" />
        {row.maxStages}
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: ({ row }) => {
      const colors = AMENDMENT_STATUS_COLORS as Record<string, string>;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
            colors[row.status] || 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {row.status}
        </span>
      );
    },
  },
];
