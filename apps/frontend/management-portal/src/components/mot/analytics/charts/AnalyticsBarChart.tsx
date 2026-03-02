'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { BarChartItem } from '@/data/mot/analytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Types ────────────────────────────────────────────────────────

interface AnalyticsBarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
  height?: number;
  loading?: boolean;
  formatValue?: (value: number) => string;
}

// ── Component ────────────────────────────────────────────────────

export function AnalyticsBarChart({
  data,
  title,
  subtitle,
  color = '#3b82f6',
  horizontal = false,
  showValues = false,
  height = 300,
  loading = false,
  formatValue = (v) => v.toLocaleString(),
}: AnalyticsBarChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        {title && <div className="h-5 bg-gray-200 rounded w-40 mb-4" />}
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);
  const colors = data.map((d) => d.color || color);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.map((c) => `${c}99`),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.9)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: (context: any) => formatValue(context.raw),
        },
      },
    },
    scales: {
      x: {
        grid: { display: !horizontal, color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
      y: {
        grid: { display: horizontal, color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
