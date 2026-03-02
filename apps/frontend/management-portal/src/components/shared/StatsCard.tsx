'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Sparkline ─────────────────────────────────────────────────────

/**
 * Mini SVG sparkline chart rendered as a polyline.
 *
 * @param data  - Array of numeric values (minimum 2 points)
 * @param color - Stroke colour (CSS colour string)
 * @param width - SVG viewBox width  (default `80`)
 * @param height - SVG viewBox height (default `28`)
 */
export function Sparkline({
  data,
  color,
  width = 80,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ── Trend indicator ───────────────────────────────────────────────

/** Trend direction — `up`, `down`, or `stable`. */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Small arrow / dash icon indicating a KPI trend direction.
 *
 * @param trend    - The trend direction
 * @param positive - Whether an *upward* trend is a good thing
 */
export function TrendIcon({
  trend,
  positive,
}: {
  trend: TrendDirection;
  positive: boolean;
}) {
  if (trend === 'stable') return <Minus className="h-3 w-3 text-gray-400" />;

  const isGood = (trend === 'up') === positive;
  const cls = isGood ? 'text-green-600' : 'text-red-600';

  return trend === 'up' ? (
    <ArrowUp className={`h-3 w-3 ${cls}`} />
  ) : (
    <ArrowDown className={`h-3 w-3 ${cls}`} />
  );
}

// ── Colour tokens ─────────────────────────────────────────────────

/** Available accent colours for a stats card. */
export type StatsCardColor =
  | 'blue'
  | 'teal'
  | 'green'
  | 'red'
  | 'purple'
  | 'amber';

const BG: Record<StatsCardColor, string> = {
  blue:   'bg-blue-50   border-blue-200',
  teal:   'bg-teal-50   border-teal-200',
  green:  'bg-green-50  border-green-200',
  red:    'bg-red-50    border-red-200',
  purple: 'bg-purple-50 border-purple-200',
  amber:  'bg-amber-50  border-amber-200',
};

const ICON_BG: Record<StatsCardColor, string> = {
  blue:   'bg-blue-100   text-blue-600',
  teal:   'bg-teal-100   text-teal-600',
  green:  'bg-green-100  text-green-600',
  red:    'bg-red-100    text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  amber:  'bg-amber-100  text-amber-600',
};

const SPARK_COLOR: Record<StatsCardColor, string> = {
  blue:   '#3b82f6',
  teal:   '#14b8a6',
  green:  '#22c55e',
  red:    '#ef4444',
  purple: '#a855f7',
  amber:  '#f59e0b',
};

// ── StatsCard props ───────────────────────────────────────────────

/**
 * Descriptor for a single KPI / stat metric.
 *
 * Use this interface when building the array that is passed to
 * `<StatsCardsContainer>`.
 */
export interface StatsCardMetric {
  /** Short label displayed above the value (e.g. "Total Stops"). */
  label: string;
  /** Formatted display value (e.g. "1,234"). */
  value: string;
  /** Trend direction arrow. */
  trend: TrendDirection;
  /** Trend change text (e.g. "+12 this month"). Hidden when empty. */
  trendValue: string;
  /** When `true`, an upward trend is coloured green; otherwise red. */
  trendPositiveIsGood: boolean;
  /** Accent colour. */
  color: StatsCardColor;
  /** Array of numeric data points for the sparkline (min 2). */
  sparkData: number[];
  /**
   * Lucide icon component rendered inside the coloured pill.
   * Optional — when omitted the pill is hidden.
   */
  icon?: LucideIcon;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * A reusable KPI / statistics card.
 *
 * Displays an optional icon pill, a label, a sparkline chart, a large
 * value, and a trend indicator.
 *
 * @example
 * ```tsx
 * <StatsCard
 *   label="Total Bus Stops"
 *   value="1,234"
 *   trend="up"
 *   trendValue="+12 this month"
 *   trendPositiveIsGood
 *   color="blue"
 *   sparkData={[10, 15, 12, 18, 20, 22]}
 *   icon={MapPin}
 * />
 * ```
 */
export function StatsCard({
  label,
  value,
  trend,
  trendValue,
  trendPositiveIsGood,
  color,
  sparkData,
  icon: Icon,
}: StatsCardMetric) {
  const trendColor =
    trend === 'stable'
      ? 'text-gray-500'
      : (trend === 'up') === trendPositiveIsGood
      ? 'text-green-600'
      : 'text-red-600';

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${BG[color]}`}
    >
      {/* Header row: icon pill + label on left, sparkline on right */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <span
              className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg ${ICON_BG[color]}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          )}
          <p className="text-sm font-medium text-gray-600 leading-tight">
            {label}
          </p>
        </div>
        <Sparkline data={sparkData} color={SPARK_COLOR[color]} />
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-900 tracking-tight">
        {value}
      </p>

      {/* Trend */}
      {trendValue && trendValue !== 'No change' ? (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}
        >
          <TrendIcon trend={trend} positive={trendPositiveIsGood} />
          <span>{trendValue}</span>
        </div>
      ) : null}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────

/**
 * Animated skeleton placeholder matching `StatsCard` dimensions.
 *
 * Used by `<StatsCardsContainer>` during loading state.
 */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-7 bg-gray-100 rounded w-20" />
      </div>
      <div className="h-7 bg-gray-200 rounded w-32 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-28" />
    </div>
  );
}
