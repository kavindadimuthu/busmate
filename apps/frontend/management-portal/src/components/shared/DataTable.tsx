'use client';

import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';

// ── Column definition ─────────────────────────────────────────────

/**
 * Column descriptor for `<DataTable>`.
 *
 * Generic over `T` — the row data type.
 */
export interface DataTableColumn<T> {
  /** Unique column key. Also used as the `sortBy` value when sortable. */
  key: string;
  /** Column header label. */
  header: string;
  /**
   * When `true` the column header is clickable and sort indicators are
   * shown.
   *
   * @default false
   */
  sortable?: boolean;
  /**
   * Custom render function for the cell content.
   *
   * When omitted the table renders `String(row[key])`.
   *
   * @param row   - The full row data object
   * @param index - The row index
   */
  render?: (row: T, index: number) => React.ReactNode;
  /** Extra Tailwind class names applied to every `<td>` in this column. */
  cellClassName?: string;
  /** Extra Tailwind class names applied to the `<th>` header cell. */
  headerClassName?: string;
  /**
   * Minimum width hint (Tailwind class e.g. `"min-w-[160px]"`).
   * Applied to both header and body cells.
   */
  minWidth?: string;
}

// ── Sort state ────────────────────────────────────────────────────

/** Describes the current sort field and direction. */
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// ── Sort icon (internal) ──────────────────────────────────────────

function SortIcon({
  field,
  currentSort,
}: {
  field: string;
  currentSort: SortState;
}) {
  if (currentSort.field !== field) {
    return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 shrink-0" />;
  }
  return currentSort.direction === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
  );
}

// ── Skeleton row (internal) ───────────────────────────────────────

function SkeletonRow({
  colCount,
  index,
}: {
  colCount: number;
  index: number;
}) {
  return (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
      {Array.from({ length: colCount }).map((_, ci) => (
        <td key={ci} className="px-4 py-3">
          <div
            className="h-3.5 bg-gray-200 rounded animate-pulse"
            style={{ width: `${50 + ((index * 7 + ci * 11) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── DataTable props ───────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Column definitions. */
  columns: DataTableColumn<T>[];
  /** Row data array. */
  data: T[];
  /** Show skeleton loading state. */
  loading?: boolean;
  /** Number of skeleton rows to render when loading. @default 8 */
  skeletonRowCount?: number;
  /** Current sort state — required when any column is sortable. */
  currentSort?: SortState;
  /** Callback fired when a sortable column header is clicked. */
  onSort?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  /**
   * Function that returns a unique key for each row.
   *
   * When omitted the row index is used as the key (not recommended for
   * lists that change order).
   */
  rowKey?: (row: T, index: number) => string | number;
  /**
   * Extra class names applied to a row's `<tr>`.
   * Receives the row data and its index.
   */
  rowClassName?: (row: T, index: number) => string;
  /**
   * Content rendered when `data` is empty and `loading` is `false`.
   *
   * Can be a ReactNode or a render function receiving column count.
   */
  emptyState?: React.ReactNode | ((colCount: number) => React.ReactNode);
  /** Show a refreshing indicator bar at the bottom of the table. */
  showRefreshing?: boolean;
  /** Extra class names applied to the outer wrapper. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Generic, column-driven data table with sorting, loading skeletons,
 * custom cell renderers, and an empty state.
 *
 * @example
 * ```tsx
 * interface User { id: string; name: string; email: string; }
 *
 * const columns: DataTableColumn<User>[] = [
 *   { key: 'name',  header: 'Name',  sortable: true },
 *   { key: 'email', header: 'Email', sortable: true },
 *   {
 *     key: 'actions',
 *     header: 'Actions',
 *     headerClassName: 'text-center',
 *     render: (row) => (
 *       <button onClick={() => alert(row.id)}>View</button>
 *     ),
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   loading={isLoading}
 *   currentSort={{ field: 'name', direction: 'asc' }}
 *   onSort={handleSort}
 *   rowKey={(row) => row.id}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  skeletonRowCount = 8,
  currentSort = { field: '', direction: 'asc' },
  onSort,
  rowKey,
  rowClassName,
  emptyState,
  showRefreshing = false,
  className = '',
}: DataTableProps<T>) {
  const handleSort = (field: string) => {
    if (!onSort) return;
    const newDir =
      currentSort.field === field && currentSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    onSort(field, newDir);
  };

  // ── Header ────────────────────────────────────────────────────

  const renderHeader = () => (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        {columns.map((col) => {
          const sortable = !!col.sortable;
          const isActive = sortable && currentSort.field === col.key;

          return (
            <th
              key={col.key}
              scope="col"
              onClick={sortable ? () => handleSort(col.key) : undefined}
              className={[
                'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider select-none',
                sortable
                  ? 'cursor-pointer hover:bg-gray-100/80 transition-colors duration-100'
                  : '',
                isActive ? 'text-blue-600' : 'text-gray-500',
                col.minWidth ?? '',
                col.headerClassName ?? '',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5">
                <span>{col.header}</span>
                {sortable && (
                  <SortIcon field={col.key} currentSort={currentSort} />
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );

  // ── Loading skeleton ──────────────────────────────────────────

  if (loading && data.length === 0) {
    return (
      <div className={`overflow-x-auto rounded-t-xl ${className}`}>
        <table className="min-w-full">
          {renderHeader()}
          <tbody>
            {Array.from({ length: skeletonRowCount }).map((_, i) => (
              <SkeletonRow key={i} colCount={columns.length} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────

  if (data.length === 0) {
    const content =
      typeof emptyState === 'function'
        ? emptyState(columns.length)
        : emptyState;

    if (content) {
      return <>{content}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No data found
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Try adjusting your search or filters to find what you&apos;re
          looking for.
        </p>
      </div>
    );
  }

  // ── Data rows ─────────────────────────────────────────────────

  return (
    <div className={`overflow-x-auto rounded-t-xl ${className}`}>
      <table className="min-w-full">
        {renderHeader()}
        <tbody>
          {data.map((row, idx) => {
            const key = rowKey ? rowKey(row, idx) : idx;
            const extraCls = rowClassName ? rowClassName(row, idx) : '';

            return (
              <tr
                key={key}
                className={[
                  'transition-colors duration-100',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                  'hover:bg-blue-50/40',
                  extraCls,
                ].join(' ')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3',
                      col.minWidth ?? '',
                      col.cellClassName ?? '',
                    ].join(' ')}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Inline refreshing indicator */}
      {showRefreshing && loading && data.length > 0 && (
        <div className="px-4 py-2.5 bg-blue-50/60 border-t border-blue-100 flex items-center justify-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-blue-600 font-medium">
            Refreshing…
          </span>
        </div>
      )}
    </div>
  );
}
