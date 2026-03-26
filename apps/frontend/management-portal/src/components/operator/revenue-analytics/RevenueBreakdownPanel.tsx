'use client';

import React from 'react';
import type { RevenueBreakdownItem } from '@/data/operator/revenue';

// ── Props ─────────────────────────────────────────────────────────

interface RevenueBreakdownPanelProps {
  /** Title displayed above the breakdown. */
  title: string;
  /** Breakdown data items. */
  data: RevenueBreakdownItem[];
  /** Show skeleton loading state. */
  loading: boolean;
  /** Maximum items to display (default: 6). */
  maxItems?: number;
}

// ── Colour palette for bars ───────────────────────────────────────

const BAR_COLORS = [
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#22c55e', // green
  '#ec4899', // pink
  '#6366f1', // indigo
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Horizontal bar chart panel showing revenue breakdown by a dimension
 * (bus, route, conductor, payment method).
 *
 * Sorts items by total revenue descending and displays a simple
 * proportional bar chart with labels and values.
 */
export function RevenueBreakdownPanel({
  title,
  data,
  loading,
  maxItems = 6,
}: RevenueBreakdownPanelProps) {
  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-secondary rounded w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-28 h-3.5 bg-secondary rounded" />
              <div className="flex-1 h-3 bg-muted rounded-full" />
              <div className="w-24 h-3.5 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.slice(0, maxItems);
  const maxValue = displayData.length > 0 ? Math.max(...displayData.map((d) => d.totalRevenue)) : 1;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-base font-semibold text-foreground mb-5">{title}</h3>

      {displayData.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No data available for current filters
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayData.map((item, index) => (
            <div key={item.id} className="group">
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-32 min-w-[8rem] shrink-0">
                  <p className="text-sm font-medium text-foreground truncate" title={item.label}>
                    {item.label}
                  </p>
                  {item.subLabel && (
                    <p className="text-xs text-muted-foreground/70 truncate">{item.subLabel}</p>
                  )}
                </div>

                {/* Bar */}
                <div className="flex-1 bg-muted rounded-full h-2.5 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(item.totalRevenue / maxValue) * 100}%`,
                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                    }}
                  />
                </div>

                {/* Value */}
                <div className="w-28 text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    Rs {item.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 tabular-nums">
                    {item.ticketsSold.toLocaleString()} tickets
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
