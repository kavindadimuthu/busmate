'use client';

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
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { TrendPoint } from '@/data/admin/dashboard-v2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// ── Tab config ────────────────────────────────────────────────────

type MetricKey = 'requestRate' | 'errorRate' | 'activeSessions' | 'passengers';

const METRICS: { key: MetricKey; label: string; color: string; fill: string; yLabel: string }[] = [
  { key: 'requestRate',    label: 'Request Rate',   color: '#3b82f6', fill: 'rgba(59,130,246,0.08)', yLabel: 'req/s' },
  { key: 'errorRate',      label: 'Error Rate (%)', color: '#ef4444', fill: 'rgba(239,68,68,0.08)',  yLabel: '%' },
  { key: 'activeSessions', label: 'Active Sessions',color: '#14b8a6', fill: 'rgba(20,184,166,0.08)', yLabel: 'sessions' },
  { key: 'passengers',     label: 'Passengers',     color: '#a855f7', fill: 'rgba(168,85,247,0.08)', yLabel: 'users' },
];

// ── Main component ────────────────────────────────────────────────

interface DashboardTrendsChartProps {
  trendHistory: TrendPoint[];
  loading?: boolean;
}

export function DashboardTrendsChart({ trendHistory, loading = false }: DashboardTrendsChartProps) {
  const [active, setActive] = useState<MetricKey>('requestRate');
  const [compareMode, setCompareMode] = useState(false);

  if (loading || trendHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4 shrink-0" />
        <div className="flex-1 min-h-[250px] bg-gray-100 rounded" />
      </div>
    );
  }

  const labels = trendHistory.map((p) => p.label);

  const primaryMetric = METRICS.find((m) => m.key === active)!;

  const datasets = compareMode
    ? METRICS.map((m) => ({
        label: m.label,
        data: trendHistory.map((p) => p[m.key]),
        borderColor: m.color,
        backgroundColor: m.fill,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
        yAxisID: 'y',
      }))
    : [
        {
          label: primaryMetric.label,
          data: trendHistory.map((p) => p[primaryMetric.key]),
          borderColor: primaryMetric.color,
          backgroundColor: primaryMetric.fill,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
      ];

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: compareMode },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17,24,39,0.9)',
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 8,
          font: { size: 10 },
          color: '#9ca3af',
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        ticks: { font: { size: 10 }, color: '#9ca3af' },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
    },
    interaction: { mode: 'index' as const, intersect: false },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">System Trends <span className="font-normal text-gray-400 text-xs ml-1">— last 24 h</span></h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              compareMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Compare all
          </button>

          {/* Metric tabs */}
          {!compareMode && METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                active === m.key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={active === m.key ? { backgroundColor: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[250px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
