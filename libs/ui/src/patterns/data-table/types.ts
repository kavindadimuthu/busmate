import type * as React from "react";

export interface ColumnDef<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => unknown;
  cell?: (props: { row: TData; value: unknown }) => React.ReactNode;
  sortable?: boolean;
  /** Hide on screens smaller than this breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Column width (Tailwind class) */
  width?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  selectedRows?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  getRowId: (row: TData) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowActions?: (row: TData) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  bulkActions?: React.ReactNode;
}
