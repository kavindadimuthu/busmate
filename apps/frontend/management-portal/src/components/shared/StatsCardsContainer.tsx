'use client';

import React from 'react';
import { StatsCard, StatsCardSkeleton } from './StatsCard';
import type { StatsCardMetric } from './StatsCard';

// ── Props ─────────────────────────────────────────────────────────

export interface StatsCardsContainerProps {
  /** Array of KPI metric descriptors to render. */
  metrics: StatsCardMetric[];
  /**
   * Number of skeleton cards to show while loading.
   * Defaults to the `columns` value or `5` if not specified.
   */
  skeletonCount?: number;
  /** Show skeleton loading state. */
  loading?: boolean;
  /**
   * Responsive column count.
   *
   * Accepted values (`sm`, `md`, `xl` breakpoints are applied automatically):
   * - `2` → 1 @ xs, 2 @ sm
   * - `3` → 1 @ xs, 2 @ sm, 3 @ lg
   * - `4` → 1 @ xs, 2 @ sm, 4 @ xl
   * - `5` → 1 @ xs, 2 @ sm, 5 @ xl  *(default)*
   * - `6` → 1 @ xs, 2 @ sm, 3 @ lg, 6 @ xl
   *
   * @default 5
   */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Extra class names applied to the grid wrapper. */
  className?: string;
}

// ── Grid class lookup ─────────────────────────────────────────────

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

// ── Component ─────────────────────────────────────────────────────

/**
 * Responsive grid container for `<StatsCard>` components.
 *
 * Renders a loading skeleton when `loading` is `true`, otherwise maps over
 * the supplied `metrics` array and renders a `<StatsCard>` for each entry.
 *
 * @example
 * ```tsx
 * <StatsCardsContainer
 *   loading={isLoading}
 *   columns={5}
 *   metrics={[
 *     { label: 'Total', value: '100', trend: 'up', trendValue: '+5', trendPositiveIsGood: true, color: 'blue', sparkData: [10,12,15], icon: MapPin },
 *     // …more metrics
 *   ]}
 * />
 * ```
 */
export function StatsCardsContainer({
  metrics,
  loading = false,
  columns = 5,
  skeletonCount,
  className = '',
}: StatsCardsContainerProps) {
  const gridCls = GRID_COLS[columns] ?? GRID_COLS[5];
  const skeletons = skeletonCount ?? columns;

  if (loading) {
    return (
      <div className={`grid ${gridCls} gap-4 ${className}`}>
        {Array.from({ length: skeletons }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCls} gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <StatsCard key={index} {...metric} />
      ))}
    </div>
  );
}
