'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// ── Page-list builder ─────────────────────────────────────────────

/**
 * Build an array of page numbers with ellipsis (`'…'`) gaps.
 *
 * Always shows the first and last page.  Pages adjacent to the current
 * page are included to provide context.
 */
function buildPageList(
  current: number,
  total: number,
): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | '…')[] = [0];

  const rangeStart = Math.max(1, current - 1);
  const rangeEnd = Math.min(total - 2, current + 1);

  if (rangeStart > 1) pages.push('…');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < total - 2) pages.push('…');

  pages.push(total - 1);

  return pages;
}

// ── Nav icon button (internal) ────────────────────────────────────

function NavBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="
        inline-flex items-center justify-center w-8 h-8 rounded-lg
        text-gray-500 hover:text-gray-900 hover:bg-gray-100
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500
        transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      "
    >
      {children}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────

export interface DataPaginationProps {
  /** Zero-based current page index. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of records across all pages. */
  totalElements: number;
  /** Number of records per page. */
  pageSize: number;
  /** Callback fired when the page changes (zero-based). */
  onPageChange: (page: number) => void;
  /** Callback fired when the page size changes. */
  onPageSizeChange: (size: number) => void;
  /** Disable interaction while data is loading. */
  loading?: boolean;
  /**
   * Available page-size options.
   *
   * @default [5, 10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  /** Show the loading progress bar at the bottom. @default true */
  showLoadingBar?: boolean;
  /** Extra class names applied to the outer wrapper. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Full-featured pagination bar with record range, page-size selector,
 * first/prev/next/last buttons, and numbered page links.
 *
 * Zero-based page index — the display is automatically converted to
 * 1-based for the user.
 *
 * @example
 * ```tsx
 * <DataPagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   totalElements={totalElements}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   loading={isLoading}
 * />
 * ```
 */
export function DataPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showLoadingBar = true,
  className = '',
}: DataPaginationProps) {
  const startRecord =
    totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min(
    (currentPage + 1) * pageSize,
    totalElements,
  );

  const goTo = (page: number) => {
    if (
      page >= 0 &&
      page < totalPages &&
      page !== currentPage &&
      !loading
    ) {
      onPageChange(page);
    }
  };

  const pageList = buildPageList(currentPage, totalPages);

  return (
    <div className={`border-t border-gray-200 bg-white rounded-b-xl ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 px-4 py-3">

        {/* ── Left: record count + page-size selector ─────────── */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="whitespace-nowrap">
            {totalElements === 0 ? (
              'No results'
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {startRecord.toLocaleString()}–
                  {endRecord.toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-700">
                  {totalElements.toLocaleString()}
                </span>
              </>
            )}
          </span>

          <span className="text-gray-200 select-none">|</span>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="dataPaginationPageSize"
              className="text-xs text-gray-400 whitespace-nowrap"
            >
              Rows
            </label>
            <select
              id="dataPaginationPageSize"
              value={pageSize}
              onChange={(e) => {
                if (!loading) onPageSizeChange(Number(e.target.value));
              }}
              disabled={loading}
              className="
                h-7 px-2 pr-6 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed
                appearance-none cursor-pointer
                bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw1IDVMOSAxIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')]
                bg-no-repeat bg-[right_8px_center]
              "
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Right: pagination buttons ───────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First */}
            <NavBtn
              onClick={() => goTo(0)}
              disabled={currentPage === 0 || loading}
              title="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </NavBtn>

            {/* Previous */}
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="
                inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium
                text-gray-600 hover:text-gray-900 hover:bg-gray-100
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              "
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-0.5">
              {pageList.map((item, i) =>
                item === '…' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="w-8 text-center text-xs text-gray-400 select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goTo(item as number)}
                    disabled={loading}
                    className={[
                      'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-all duration-100',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      item === currentPage
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'text-gray-700 hover:bg-gray-100',
                      'disabled:cursor-not-allowed',
                    ].join(' ')}
                  >
                    {(item as number) + 1}
                  </button>
                ),
              )}
            </div>

            {/* Next */}
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || loading}
              className="
                inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium
                text-gray-600 hover:text-gray-900 hover:bg-gray-100
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
                transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              "
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last */}
            <NavBtn
              onClick={() => goTo(totalPages - 1)}
              disabled={currentPage === totalPages - 1 || loading}
              title="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </NavBtn>
          </div>
        )}
      </div>

      {/* Loading bar */}
      {showLoadingBar && loading && (
        <div className="h-0.5 w-full overflow-hidden rounded-b-xl">
          <div
            className="h-full bg-blue-500 animate-[progress_1.2s_ease-in-out_infinite]"
            style={{ width: '40%' }}
          />
        </div>
      )}
    </div>
  );
}
