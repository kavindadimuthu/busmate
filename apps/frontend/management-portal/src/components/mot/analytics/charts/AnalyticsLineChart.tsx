'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Types ────────────────────────────────────────────────────────

interface DatasetConfig {
  key: string;
  label: string;
  color: string;
  fill?: string;
}

interface AnalyticsLineChartProps {
  data: Record<string, any>[];
  datasets: DatasetConfig[];
  title?: string;
  subtitle?: string;
  labelKey?: string;
  height?: number;
  loading?: boolean;
  showCompareToggle?: boolean;
  defaultCompare?: boolean;
  formatValue?: (value: number) => string;
}

// ── Component ────────────────────────────────────────────────────

export function AnalyticsLineChart({
  data,
  datasets,
  title,
  subtitle,
  labelKey = 'label',
  height = 300,
  loading = false,
  showCompareToggle = false,
  defaultCompare = false,
  formatValue = (v) => v.toLocaleString(),
}: AnalyticsLineChartProps) {
  const [active, setActive] = useState(datasets[0]?.key || '');
  const [compareMode, setCompareMode] = useState(defaultCompare);

  if (loading || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        {title && <div className="h-5 bg-gray-200 rounded w-40 mb-4" />}
        <div className="h-52 bg-gray-100 rounded" />
      </div>
    );
  }

  const labels = data.map((d) => d[labelKey]);
  const primaryDataset = datasets.find((d) => d.key === active);

  const chartDatasets = compareMode
    ? datasets.map((d) => ({
        label: d.label,
        data: data.map((point) => point[d.key]),
        borderColor: d.color,
        backgroundColor: d.fill || `${d.color}10`,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
      }))
    : primaryDataset
    ? [
        {
          label: primaryDataset.label,
          data: data.map((point) => point[primaryDataset.key]),
          borderColor: primaryDataset.color,
          backgroundColor: primaryDataset.fill || `${primaryDataset.color}15`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        },
      ]
    : [];

  const chartData = { labels, datasets: chartDatasets };

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
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatValue(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 10, font: { size: 10 }, color: '#9ca3af' },
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <div>
            {title && <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>}
            {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare toggle */}
          {showCompareToggle && datasets.length > 1 && (
            <button
              onClick={() => setCompareMode((v) => !v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                compareMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Compare all
            </button>
          )}

          {/* Metric tabs */}
          {!compareMode &&
            datasets.map((d) => (
              <button
                key={d.key}
                onClick={() => setActive(d.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  active === d.key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={active === d.key ? { backgroundColor: d.color } : undefined}
              >
                {d.label}
              </button>
            ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
