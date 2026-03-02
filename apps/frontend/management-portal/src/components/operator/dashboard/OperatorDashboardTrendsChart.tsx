'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendPoint } from '@/data/operator/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// ── Tab config ────────────────────────────────────────────────────

type MetricKey = 'trips' | 'passengers' | 'revenue' | 'onTimeRate' | 'fuelCost';

const METRICS: { key: MetricKey; label: string; color: string; fill: string; yLabel: string }[] = [
  { key: 'trips',      label: 'Trips',        color: '#3b82f6', fill: 'rgba(59,130,246,0.08)',  yLabel: 'trips' },
  { key: 'passengers', label: 'Passengers',   color: '#14b8a6', fill: 'rgba(20,184,166,0.08)',  yLabel: 'passengers' },
  { key: 'revenue',    label: 'Revenue',      color: '#22c55e', fill: 'rgba(34,197,94,0.08)',   yLabel: 'Rs' },
  { key: 'onTimeRate', label: 'On-Time Rate', color: '#a855f7', fill: 'rgba(168,85,247,0.08)',  yLabel: '%' },
  { key: 'fuelCost',   label: 'Fuel Cost',    color: '#f59e0b', fill: 'rgba(245,158,11,0.08)',  yLabel: 'Rs' },
];

// ── Main component ────────────────────────────────────────────────

interface OperatorDashboardTrendsChartProps {
  trendHistory: TrendPoint[];
  loading?: boolean;
}

export function OperatorDashboardTrendsChart({ trendHistory, loading = false }: OperatorDashboardTrendsChartProps) {
  const [active, setActive] = useState<MetricKey>('trips');
  const [compareMode, setCompareMode] = useState(false);

  if (loading || trendHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="h-72 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  const labels = trendHistory.map((p) => p.label);
  const primaryMetric = METRICS.find((m) => m.key === active)!;

  const formatValue = (v: number) => {
    if (primaryMetric.key === 'revenue' || primaryMetric.key === 'fuelCost') {
      if (v >= 1000000) return `Rs ${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `Rs ${(v / 1000).toFixed(0)}K`;
      return `Rs ${v}`;
    }
    if (primaryMetric.key === 'onTimeRate') return `${v}%`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const datasets: any[] = [
    {
      label: primaryMetric.label,
      data: trendHistory.map((p) => p[primaryMetric.key]),
      borderColor: primaryMetric.color,
      backgroundColor: primaryMetric.fill,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    },
  ];

  if (compareMode) {
    const secondaryKey: MetricKey = active === 'revenue' ? 'fuelCost' : 'revenue';
    const secondary = METRICS.find((m) => m.key === secondaryKey)!;
    datasets.push({
      label: secondary.label,
      data: trendHistory.map((p) => p[secondaryKey]),
      borderColor: secondary.color,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
      borderDash: [4, 3],
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: compareMode, position: 'top' as const, labels: { font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatValue(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 10 },
          color: '#9ca3af',
          callback: (v: any) => formatValue(v),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-900">Weekly Performance Trends</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              compareMode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Compare
          </button>
          {/* Metric tabs */}
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                active === m.key
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              style={active === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <Line data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
}
