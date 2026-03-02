'use client';

import { DataPagination } from '@/components/shared/DataPagination';

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
 * Thin wrapper around the shared `<DataPagination>` component —
 * passes through all props and applies route-specific page size options.
 */
export function RoutePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
}: RoutePaginationProps) {
  return (
    <DataPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalElements={totalElements}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      pageSizeOptions={[5, 10, 25, 50, 100]}
    />
  );
}
