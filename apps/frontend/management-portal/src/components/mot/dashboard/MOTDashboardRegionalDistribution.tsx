'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { RegionalDistributionItem } from '@/data/mot/dashboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MOTDashboardRegionalDistributionProps {
  regions: RegionalDistributionItem[];
  loading?: boolean;
}

export function MOTDashboardRegionalDistribution({ regions, loading = false }: MOTDashboardRegionalDistributionProps) {
  if (loading || regions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="h-56 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  // Sort by total resource count (descending)
  const sortedRegions = [...regions].sort((a, b) => 
    (b.buses + b.routes + b.staff) - (a.buses + a.routes + a.staff)
  );

  const chartData = {
    labels: sortedRegions.map((r) => r.region.replace(' Province', '')),
    datasets: [
      {
        label: 'Buses',
        data: sortedRegions.map((r) => r.buses),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Routes',
        data: sortedRegions.map((r) => r.routes),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Staff',
        data: sortedRegions.map((r) => r.staff),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { color: '#9ca3af', font: { size: 10 } },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          font: { size: 11 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex;
            return sortedRegions[idx]?.region || '';
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Regional Distribution</h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>Total: {regions.reduce((s, r) => s + r.buses, 0).toLocaleString()} buses</span>
        </div>
      </div>

      <div className="h-72">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
