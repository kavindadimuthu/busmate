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
import type { NotificationStats } from '@/data/admin/notifications';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

interface NotificationTrendChartProps {
  stats: NotificationStats;
  loading?: boolean;
}

export function NotificationTrendChart({ stats, loading = false }: NotificationTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 h-72 animate-pulse">
        <div className="h-4 bg-secondary rounded w-40 mb-4" />
        <div className="h-full bg-muted rounded" />
      </div>
    );
  }

  const labels = stats.dailyCounts.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Sent',
        data: stats.dailyCounts.map((d) => d.sent),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Scheduled',
        data: stats.dailyCounts.map((d) => d.scheduled),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Drafts',
        data: stats.dailyCounts.map((d) => d.draft),
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
        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' as const, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6b7280' } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#6b7280' } },
    },
  };

  const totalSent = stats.dailyCounts.reduce((s, d) => s + d.sent, 0);
  const totalScheduled = stats.dailyCounts.reduce((s, d) => s + d.scheduled, 0);
  const totalDraft = stats.dailyCounts.reduce((s, d) => s + d.draft, 0);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Notification Activity (Last 7 Days)</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" /> Sent: {totalSent}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Scheduled: {totalScheduled}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--purple-500))]" /> Drafts: {totalDraft}
          </span>
        </div>
      </div>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
