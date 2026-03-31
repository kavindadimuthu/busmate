'use client';

import * as React from 'react';
import { Eye, Shield } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import type { SecurityLog } from '@/data/admin/types';
import { securityLogColumns } from './LogColumns';

interface SecurityLogsTableProps
  extends Pick<
    DataTableProps<SecurityLog>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  logs: SecurityLog[];
  totalItems: number;
  onViewDetail: (logId: string) => void;
}

export function SecurityLogsTable({
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
}: SecurityLogsTableProps) {
  const rowActions = React.useCallback(
    (log: SecurityLog) => (
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
      columns={securityLogColumns}
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
          icon={<Shield className="h-8 w-8" />}
          title="No security logs found"
          description="Try adjusting your search or filter criteria"
        />
      }
    />
  );
}
