'use client';

import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import type { TrendPoint } from '@/data/mot/analytics';

// ── Types ────────────────────────────────────────────────────────

interface AnalyticsTrendsChartProps {
  data: TrendPoint[];
  loading?: boolean;
}

// ── Dataset configs ──────────────────────────────────────────────

const DATASETS = [
  { key: 'trips', label: 'Trips', color: '#3b82f6', fill: 'rgba(59,130,246,0.08)' },
  { key: 'passengers', label: 'Passengers', color: '#14b8a6', fill: 'rgba(20,184,166,0.08)' },
  { key: 'revenue', label: 'Revenue', color: '#22c55e', fill: 'rgba(34,197,94,0.08)' },
  { key: 'busesActive', label: 'Active Buses', color: '#f59e0b', fill: 'rgba(245,158,11,0.08)' },
];

// ── Component ────────────────────────────────────────────────────

export function AnalyticsTrendsChart({ data, loading = false }: AnalyticsTrendsChartProps) {
  return (
    <AnalyticsLineChart
      data={data}
      datasets={DATASETS}
      title="Operations Trends"
      subtitle="Last 30 days"
      labelKey="label"
      height={320}
      loading={loading}
      showCompareToggle={true}
      formatValue={(v) => {
        if (v >= 1000000) return `Rs ${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
        return v.toLocaleString();
      }}
    />
  );
}
