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
import { TrendPoint } from '@/data/mot/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// ── Tab config ────────────────────────────────────────────────────

type MetricKey = 'trips' | 'passengers' | 'revenue' | 'onTimeRate' | 'busesActive';

const METRICS: { key: MetricKey; label: string; color: string; fill: string; yLabel: string }[] = [
  { key: 'trips',       label: 'Trips',         color: '#3b82f6', fill: 'rgba(59,130,246,0.08)',  yLabel: 'trips' },
  { key: 'passengers',  label: 'Passengers',    color: '#14b8a6', fill: 'rgba(20,184,166,0.08)',  yLabel: 'passengers' },
  { key: 'revenue',     label: 'Revenue',       color: '#22c55e', fill: 'rgba(34,197,94,0.08)',   yLabel: 'Rs' },
  { key: 'onTimeRate',  label: 'On-Time Rate',  color: '#a855f7', fill: 'rgba(168,85,247,0.08)',  yLabel: '%' },
  { key: 'busesActive', label: 'Active Buses',  color: '#f59e0b', fill: 'rgba(245,158,11,0.08)',  yLabel: 'buses' },
];

// ── Main component ────────────────────────────────────────────────

interface MOTDashboardTrendsChartProps {
  trendHistory: TrendPoint[];
  loading?: boolean;
}

export function MOTDashboardTrendsChart({ trendHistory, loading = false }: MOTDashboardTrendsChartProps) {
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
    if (primaryMetric.key === 'revenue') {
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

  // If compare mode, add all other metrics with reduced opacity
  if (compareMode) {
    METRICS.filter((m) => m.key !== active).forEach((m) => {
      datasets.push({
        label: m.label,
        data: trendHistory.map((p) => {
          // Normalize values to similar scale for comparison
          const val = p[m.key];
          if (m.key === 'revenue') return val / 50000; // Scale down revenue
          if (m.key === 'passengers') return val / 100; // Scale down passengers
          return val;
        }),
        borderColor: m.color,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        borderDash: [4, 2],
      });
    });
  }

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (value: any) => formatValue(value),
        },
        beginAtZero: primaryMetric.key === 'onTimeRate' ? false : true,
      },
    },
    plugins: {
      legend: { display: compareMode, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const metric = METRICS.find((m) => m.label === ctx.dataset.label);
            if (!metric) return `${ctx.parsed.y}`;
            // For compare mode, we need to un-normalize
            if (compareMode && metric.key !== active) {
              let val = ctx.parsed.y;
              if (metric.key === 'revenue') val *= 50000;
              if (metric.key === 'passengers') val *= 100;
              return `${metric.label}: ${formatValue(Math.round(val))}`;
            }
            return `${metric.label}: ${formatValue(ctx.parsed.y)}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Weekly Trends</h3>
          <p className="text-xs text-gray-500 mt-0.5">Operations overview for the past week</p>
        </div>

        {/* Metric tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                active === m.key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={active === m.key ? { backgroundColor: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
          
          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              compareMode
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
