'use client';

import React from 'react';
import type { DailyRevenueSummary } from '@/data/operator/revenue';

// ── Props ─────────────────────────────────────────────────────────

interface RevenueTrendsChartProps {
  /** Daily revenue summaries to plot. */
  data: DailyRevenueSummary[];
  /** Show skeleton loading state. */
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Revenue trends chart showing daily revenue as a visual bar chart.
 *
 * Uses CSS-based bars for simplicity and zero external chart dependencies.
 * Displays the most recent 14 days of revenue data.
 */
export function RevenueTrendsChart({ data, loading }: RevenueTrendsChartProps) {
  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    const skeletonHeights = [60, 80, 40, 90, 50, 70, 55, 85, 35, 65, 75, 45, 95, 25];
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
        <div className="flex items-end gap-2 h-40">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t"
              style={{ height: `${skeletonHeights[i]}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show last 14 days, chronologically
  const chartData = data.slice(0, 14).reverse();
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.totalRevenue)) : 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">
          Daily Revenue Trend
        </h3>
        <span className="text-xs text-gray-400">Last 14 days</span>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          No revenue data available
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-44 mb-3">
            {chartData.map((day, i) => {
              const heightPct = (day.totalRevenue / maxRevenue) * 100;
              const isToday = i === chartData.length - 1;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      <p className="font-semibold">Rs {day.totalRevenue.toLocaleString()}</p>
                      <p className="opacity-70">{day.ticketsSold} tickets</p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 cursor-pointer ${
                      isToday
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-blue-200 hover:bg-blue-300'
                    }`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Date labels */}
          <div className="flex gap-1.5">
            {chartData.map((day, i) => {
              const date = new Date(day.date);
              const label = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              const isToday = i === chartData.length - 1;

              return (
                <div
                  key={day.date}
                  className={`flex-1 text-center text-[9px] truncate ${
                    isToday ? 'font-semibold text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Avg:{' '}
              <span className="font-semibold text-gray-800">
                Rs{' '}
                {Math.round(
                  chartData.reduce((s, d) => s + d.totalRevenue, 0) / chartData.length,
                ).toLocaleString()}
              </span>
              /day
            </div>
            <div className="text-xs text-gray-500">
              Total:{' '}
              <span className="font-semibold text-gray-800">
                Rs {chartData.reduce((s, d) => s + d.totalRevenue, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
