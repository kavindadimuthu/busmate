'use client';

import React from 'react';
import { DataPagination } from '@/components/shared/DataPagination';

interface BusStopPaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

/**
 * Bus-stop pagination bar.
 *
 * Thin wrapper around the shared `<DataPagination>` component — passes
 * through all props and applies bus-stop-specific page size options.
 */
export function BusStopPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
}: BusStopPaginationProps) {
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
