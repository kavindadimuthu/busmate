import type * as React from "react";
import type { ColumnDef } from "../patterns/data-table";
import type { UseDataTableOptions, DataTableState } from "../patterns/data-table";

export interface ResourceListQuery<TFilters> {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  search: string;
  filters: TFilters;
}

export interface ResourcePage<TRow> {
  content: TRow[];
  totalElements: number;
}

export interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export interface FilterFieldDef<TFilters> {
  /** Key into TFilters this field controls */
  key: Extract<keyof TFilters, string>;
  label: string;
  placeholder?: string;
  /** Key into the resolved filterOptions object to source the raw option list from */
  optionsKey?: string;
  /** Static option list (used instead of optionsKey) */
  options?: { value: string; label: string }[];
  /** Map a raw filterOptions entry (e.g. `{ id, name }`) into `{ value, label }` */
  mapOption?: (item: any) => { value: string; label: string };
  /** Tailwind width class for the select trigger */
  width?: string;
}

export interface ResourceMessages<TRow> {
  loadError?: string;
  deleteSuccess?: (row: TRow) => string;
  deleteError?: string;
  exportError?: string;
}

export interface ResourceConfig<TRow, TFilters extends Record<string, any> = Record<string, any>> {
  /** Machine name, e.g. "buses" */
  name: string;
  /** Human title used in defaults (delete dialog, toasts), e.g. "Buses" */
  title: string;
  getRowId: (row: TRow) => string;

  api: {
    list: (query: ResourceListQuery<TFilters>) => Promise<ResourcePage<TRow>>;
    stats?: () => Promise<unknown>;
    filterOptions?: () => Promise<unknown>;
    remove?: (row: TRow) => Promise<void>;
    exportAll?: () => Promise<void>;
  };

  columns: ColumnDef<TRow>[];

  initialFilters?: TFilters;
  initialSort?: UseDataTableOptions<TFilters>["initialSort"];
  searchPlaceholder?: string;

  filters?: FilterFieldDef<TFilters>[];
  /**
   * Escape hatch for bespoke filter controls (number ranges, date pickers, …) that
   * don't fit the select-based FilterFieldDef. Rendered inside the FilterBar after
   * the config-driven selects. Receives the live controller to read/write filters.
   */
  renderExtraFilters?: (controller: ResourceController<TRow, TFilters>) => React.ReactNode;

  /** Shape the raw stats API response into display-ready StatItems */
  mapStats?: (raw: unknown) => StatItem[];
  /** Shape the raw filterOptions API response into a lookup keyed by FilterFieldDef.optionsKey */
  mapFilterOptions?: (raw: unknown) => Record<string, unknown>;

  rowActions?: (ctx: {
    row: TRow;
    controller: ResourceController<TRow, TFilters>;
    navigate?: (path: string) => void;
  }) => React.ReactNode;

  deleteConfirm?: (row: TRow | undefined) => {
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: "default" | "destructive" | "warning";
  };

  routes?: {
    view?: (row: TRow) => string;
    edit?: (row: TRow) => string;
  };

  emptyState?: React.ReactNode;
  messages?: ResourceMessages<TRow>;
}

export interface ResourceController<TRow, TFilters extends Record<string, any>> {
  rows: TRow[];
  total: number;
  isLoading: boolean;

  state: DataTableState<TFilters>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: string) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  clearFilters: () => void;
  setSearch: (query: string) => void;

  stats: StatItem[];
  filterOptions: Record<string, unknown>;
  activeFilterCount: number;

  deleteDialog: {
    isOpen: boolean;
    data?: TRow;
    open: (data?: TRow) => void;
    close: () => void;
    setOpen: (open: boolean) => void;
  };
  isDeleting: boolean;
  handleDeleteConfirm: () => Promise<void>;

  isExporting: boolean;
  handleExportAll?: () => Promise<void>;

  refetch: () => void;
}
