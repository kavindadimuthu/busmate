'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { FleetStatusItem } from '@/data/mot/dashboard';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MOTDashboardFleetStatusProps {
  fleetStatus: FleetStatusItem[];
  loading?: boolean;
}

export function MOTDashboardFleetStatus({ fleetStatus, loading = false }: MOTDashboardFleetStatusProps) {
  if (loading || fleetStatus.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-40 h-40 bg-gray-100 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = fleetStatus.reduce((sum, item) => sum + item.value, 0);

  const chartData = {
    labels: fleetStatus.map((item) => item.label),
    datasets: [
      {
        data: fleetStatus.map((item) => item.value),
        backgroundColor: fleetStatus.map((item) => item.color),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Fleet Status</h3>

      {/* Chart with center text */}
      <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</span>
          <span className="text-xs text-gray-500">Total Buses</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {fleetStatus.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600 truncate">{item.label}</span>
            <span className="text-xs font-medium text-gray-900 ml-auto">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
