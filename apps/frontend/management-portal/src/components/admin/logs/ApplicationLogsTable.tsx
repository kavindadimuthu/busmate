'use client';

import * as React from 'react';
import { Eye, Terminal } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import type { ApplicationLog } from '@/data/admin/types';
import { applicationLogColumns } from './LogColumns';

interface ApplicationLogsTableProps
  extends Pick<
    DataTableProps<ApplicationLog>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  logs: ApplicationLog[];
  totalItems: number;
  onViewDetail: (logId: string) => void;
}

export function ApplicationLogsTable({
  logs,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  onViewDetail,
}: ApplicationLogsTableProps) {
  const rowActions = React.useCallback(
    (log: ApplicationLog) => (
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewDetail(log.id)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onViewDetail],
  );

  return (
    <DataTable
      columns={applicationLogColumns}
      data={logs}
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
      onRowClick={(row) => onViewDetail(row.id)}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Terminal className="h-8 w-8" />}
          title="No application logs found"
          description="Try adjusting your search or filter criteria"
        />
      }
    />
  );
}
