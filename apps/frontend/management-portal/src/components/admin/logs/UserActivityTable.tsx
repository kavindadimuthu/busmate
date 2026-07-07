'use client';

import * as React from 'react';
import { Eye, Calendar } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import type { UserActivityLog } from '@/data/admin/types';
import { userActivityColumns } from './LogColumns';

interface UserActivityTableProps
  extends Pick<
    DataTableProps<UserActivityLog>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  logs: UserActivityLog[];
  totalItems: number;
  onViewDetail: (logId: string) => void;
}

export function UserActivityTable({
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
}: UserActivityTableProps) {
  const rowActions = React.useCallback(
    (log: UserActivityLog) => (
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
      columns={userActivityColumns}
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
          icon={<Calendar className="h-8 w-8" />}
          title="No activity logs found"
          description="Try adjusting your search or filter criteria"
        />
      }
    />
  );
}
