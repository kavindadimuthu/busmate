'use client';

import React from 'react';
import type { MonthlySalarySummary } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryTrendsChartProps {
  /** Monthly salary summaries. */
  data: MonthlySalarySummary[];
  /** Show skeleton loading state. */
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Salary trends chart showing monthly total net salary,
 * bonuses, and deductions as a stacked bar chart.
 */
export function SalaryTrendsChart({ data, loading }: SalaryTrendsChartProps) {
  if (loading) {
    const skeletonHeights = [60, 80, 40, 90, 50, 70];
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-secondary rounded w-48 mb-6" />
        <div className="flex items-end gap-3 h-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-secondary rounded-t"
              style={{ height: `${skeletonHeights[i]}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Monthly Salary Trends</h3>
        <div className="text-center py-12 text-sm text-muted-foreground">
          No salary data available
        </div>
      </div>
    );
  }

  const maxGross = Math.max(...data.map((d) => d.totalGross));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-foreground">Monthly Salary Trends</h3>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/50" /> Gross
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-success/50" /> Net
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-warning/60" /> Bonuses
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-44 mb-3">
        {data.map((month) => {
          const grossPct = (month.totalGross / maxGross) * 100;
          const netPct = (month.totalNet / maxGross) * 100;

          return (
            <div key={month.month} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-foreground text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">{month.label}</p>
                  <p>Gross: Rs {month.totalGross.toLocaleString()}</p>
                  <p>Net: Rs {month.totalNet.toLocaleString()}</p>
                  <p>Bonuses: Rs {month.totalBonuses.toLocaleString()}</p>
                  <p>Staff: {month.staffCount}</p>
                </div>
              </div>

              {/* Stacked bars */}
              <div className="w-full flex gap-0.5 items-end" style={{ height: `${Math.max(grossPct, 4)}%` }}>
                <div
                  className="flex-1 bg-primary/30 hover:bg-primary/50 rounded-t transition-colors cursor-pointer"
                  style={{ height: '100%' }}
                />
                <div
                  className="flex-1 bg-success/30 hover:bg-success/50 rounded-t transition-colors cursor-pointer"
                  style={{ height: `${Math.max((netPct / grossPct) * 100, 10)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-2">
        {data.map((month) => (
          <div key={month.month} className="flex-1 text-center text-[9px] text-muted-foreground/70 truncate">
            {month.label}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          Total Gross:{' '}
          <span className="font-semibold text-foreground">
            Rs {data.reduce((s, d) => s + d.totalGross, 0).toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Total Net:{' '}
          <span className="font-semibold text-foreground">
            Rs {data.reduce((s, d) => s + d.totalNet, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
