'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  'under review': 'bg-blue-50 text-blue-700 border-blue-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-orange-50 text-orange-700 border-orange-200',
  low: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const policiesColumns: ColumnDef<any>[] = [
  {
    id: 'title',
    header: 'Policy Title',
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center ring-1 ring-blue-200/60">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {row.title}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5 truncate">{row.department}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
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
        STATUS_STYLES[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';
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
        PRIORITY_STYLES[row.priority?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200';
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
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-gray-600 bg-gray-100 border border-gray-200">
        {row.version}
      </span>
    ),
  },
  {
    id: 'lastModified',
    header: 'Last Modified',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
        {row.lastModified}
      </span>
    ),
  },
  {
    id: 'author',
    header: 'Author',
    cell: ({ row }) => <span className="text-sm text-gray-600">{row.author}</span>,
  },
];
