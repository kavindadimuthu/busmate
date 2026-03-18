'use client';

import * as React from 'react';
import { Eye, Trash2, Bell } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import { receivedNotificationColumns, sentNotificationColumns } from './notifications-columns';

interface NotificationsTableNewProps
  extends Pick<
    DataTableProps<any>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  data: any[];
  totalItems: number;
  mode: 'received' | 'sent';
  onView: (notification: any) => void;
  onDelete: (notification: any) => void;
}

export function NotificationsTableNew({
  data,
  totalItems,
  mode,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
  onDelete,
}: NotificationsTableNewProps) {
  const columns = mode === 'received' ? receivedNotificationColumns : sentNotificationColumns;

  const rowActions = React.useCallback(
    (notification: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(notification)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(notification)}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    ),
    [onView, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      loading={loading}
      getRowId={(row) => row.id}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title="No notifications found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
