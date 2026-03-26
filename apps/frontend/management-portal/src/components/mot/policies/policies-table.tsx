'use client';

import * as React from 'react';
import { Eye, Edit2, Trash2, FileText } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import { policiesColumns } from './policies-columns';

interface PoliciesTableNewProps
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
  onView: (policy: any) => void;
  onEdit: (policy: any) => void;
  onDelete: (policy: any) => void;
}

export function PoliciesTableNew({
  data,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
  onEdit,
  onDelete,
}: PoliciesTableNewProps) {
  const rowActions = React.useCallback(
    (policy: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(policy)}
          title="View Policy"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(policy)}
          title="Edit Policy"
        >
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(policy)}
          title="Delete Policy"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete]
  );

  return (
    <DataTable
      columns={policiesColumns}
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
          icon={<FileText className="h-10 w-10" />}
          title="No policies found"
          description="Try adjusting your search or filters, or upload a new policy."
        />
      }
    />
  );
}
