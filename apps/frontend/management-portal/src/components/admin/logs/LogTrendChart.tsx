'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import type { LogStats } from '@/data/admin/logs';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

interface LogTrendChartProps {
  stats: LogStats;
  loading?: boolean;
}

export function LogTrendChart({ stats, loading = false }: LogTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const labels = stats.dailyLogCounts.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'User Activity',
        data: stats.dailyLogCounts.map((d) => d.userActivity),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Security Events',
        data: stats.dailyLogCounts.map((d) => d.security),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Application Logs',
        data: stats.dailyLogCounts.map((d) => d.application),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
    },
  };

  // Quick summary row
  const totalUserActivity = stats.dailyLogCounts.reduce((sum, d) => sum + d.userActivity, 0);
  const totalSecurity = stats.dailyLogCounts.reduce((sum, d) => sum + d.security, 0);
  const totalApplication = stats.dailyLogCounts.reduce((sum, d) => sum + d.application, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Log Volume — Last 7 Days</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            Activity: <span className="font-semibold text-gray-700">{totalUserActivity.toLocaleString()}</span>
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />
            Security: <span className="font-semibold text-gray-700">{totalSecurity.toLocaleString()}</span>
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />
            App: <span className="font-semibold text-gray-700">{totalApplication.toLocaleString()}</span>
          </span>
        </div>
      </div>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
