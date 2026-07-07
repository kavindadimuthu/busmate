'use client';

import * as React from 'react';
import { Bell, Eye, Trash2 } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import type { Notification } from '@/data/admin/types';
import { notificationColumns } from './NotificationColumns';

interface NotificationTableProps
  extends Pick<
    DataTableProps<Notification>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  notifications: Notification[];
  totalItems: number;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationTable({
  notifications,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  onView,
  onDelete,
}: NotificationTableProps) {
  const rowActions = React.useCallback(
    (n: Notification) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(n.id)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(n.id)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
    ),
    [onView, onDelete],
  );

  return (
    <DataTable
      columns={notificationColumns}
      data={notifications}
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
      onRowClick={(row) => onView(row.id)}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No notifications found"
          description="Try adjusting your search or filter criteria"
        />
      }
    />
  );
}
