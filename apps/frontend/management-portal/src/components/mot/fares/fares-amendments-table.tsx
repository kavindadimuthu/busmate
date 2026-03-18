'use client';

import * as React from 'react';
import { Eye, FileText } from 'lucide-react';
import { DataTable, Button, EmptyState } from '@busmate/ui';
import type { DataTableProps } from '@busmate/ui';
import { fareAmendmentsColumns } from './fares-amendments-columns';

interface FaresAmendmentsTableNewProps
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
  onView: (amendment: any) => void;
}

export function FaresAmendmentsTableNew({
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
}: FaresAmendmentsTableNewProps) {
  const rowActions = React.useCallback(
    (amendment: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(amendment)}
          title="View fare matrix"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onView]
  );

  return (
    <DataTable
      columns={fareAmendmentsColumns}
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
          title="No amendments found"
          description="No fare amendments match your search criteria. Try adjusting your filters."
        />
      }
    />
  );
}
