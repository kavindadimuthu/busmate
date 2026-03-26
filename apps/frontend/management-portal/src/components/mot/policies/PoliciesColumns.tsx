'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-success/10 text-success border-success/20',
  draft: 'bg-warning/10 text-warning border-warning/20',
  'under review': 'bg-primary/10 text-primary border-primary/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-orange-700 border-orange-200',
  low: 'bg-muted text-muted-foreground border-border',
};

export const policiesColumns: ColumnDef<any>[] = [
  {
    id: 'title',
    header: 'Policy Title',
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-blue-200/60">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate leading-tight">
            {row.title}
          </div>
          <div className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{row.department}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
        {row.type}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: ({ row }) => {
      const style =
        STATUS_STYLES[row.status?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${style}`}
        >
          {row.status}
        </span>
      );
    },
  },
  {
    id: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const style =
        PRIORITY_STYLES[row.priority?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${style}`}
        >
          {row.priority}
        </span>
      );
    },
  },
  {
    id: 'version',
    header: 'Version',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted border border-border">
        {row.version}
      </span>
    ),
  },
  {
    id: 'lastModified',
    header: 'Last Modified',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {row.lastModified}
      </span>
    ),
  },
  {
    id: 'author',
    header: 'Author',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.author}</span>,
  },
];
