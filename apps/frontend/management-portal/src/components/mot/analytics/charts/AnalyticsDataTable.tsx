'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface Column<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface AnalyticsDataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  maxRows?: number;
  showIndex?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// ── Helper components ────────────────────────────────────────────

export function TrendBadge({
  value,
  positive = true,
  suffix = '%',
}: {
  value: number;
  positive?: boolean;
  suffix?: string;
}) {
  const isUp = value > 0;
  const isNeutral = value === 0;
  const isGood = isNeutral ? null : isUp === positive;

  const colorClass = isNeutral
    ? 'text-muted-foreground bg-muted'
    : isGood
    ? 'text-success bg-success/10'
    : 'text-destructive bg-destructive/10';

  const Icon = isNeutral ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = '#3b82f6',
  showValue = true,
}: {
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

export function RatingStars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${i < Math.floor(rating) ? 'text-warning/70' : 'text-muted-foreground/30'}`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export function AnalyticsDataTable<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  maxRows,
  showIndex = false,
  onRowClick,
  emptyMessage = 'No data available',
}: AnalyticsDataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        {title && <div className="h-5 bg-secondary rounded w-40 mb-4" />}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const displayData = maxRows ? data.slice(0, maxRows) : data;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-border/50">
          {title && <h3 className="font-semibold text-foreground text-sm">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              {showIndex && (
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  #
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showIndex ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-muted' : ''} transition-colors`}
                  onClick={() => onRowClick?.(row)}
                >
                  {showIndex && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">{rowIndex + 1}</td>
                  )}
                  {columns.map((col, colIndex) => {
                    const value = row[col.key as keyof T];
                    const rendered = col.render ? col.render(value, row, rowIndex) : value;

                    return (
                      <td
                        key={colIndex}
                        className={`px-4 py-3 text-sm ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {rendered}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {maxRows && data.length > maxRows && (
        <div className="px-6 py-3 border-t border-border/50 text-center">
          <span className="text-xs text-muted-foreground">
            Showing {maxRows} of {data.length} items
          </span>
        </div>
      )}
    </div>
  );
}
