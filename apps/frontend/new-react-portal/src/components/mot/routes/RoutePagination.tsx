'use client';

import { DataTablePagination } from '@busmate/ui';

interface RoutePaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

/**
 * Route pagination bar.
 *
 * Thin wrapper around the shared `<DataTablePagination>` component —
 * passes through all props and applies route-specific page size options.
 */
export function RoutePagination({
  currentPage,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: RoutePaginationProps) {
  return (
    <DataTablePagination
      page={currentPage}
      totalItems={totalElements}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
