'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Activity,
  Cpu,
  HardDrive,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { PerformanceSnapshot } from '@/data/admin/system-monitoring';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ── Helpers ──────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function trend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 3) return 'stable';
  const recent = data.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prev = data.slice(-10, -5);
  const prevAvg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : avg;
  const diff = ((avg - prevAvg) / (prevAvg || 1)) * 100;
  if (diff > 3) return 'up';
  if (diff < -3) return 'down';
  return 'stable';
}

function TrendIcon({ dir, positive }: { dir: 'up' | 'down' | 'stable'; positive?: boolean }) {
  if (dir === 'up') {
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className="h-3.5 w-3.5" /> Rising
      </span>
    );
  }
  if (dir === 'down') {
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-red-600' : 'text-green-600'}`}>
        <TrendingDown className="h-3.5 w-3.5" /> Falling
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-gray-500">
      <Minus className="h-3.5 w-3.5" /> Stable
    </span>
  );
}

function usageBadgeColor(value: number, thresholds = { warn: 70, danger: 85 }): string {
  if (value >= thresholds.danger) return 'text-red-600 bg-red-50';
  if (value >= thresholds.warn) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

// ── KPI Card ─────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  unit,
  trend: trendDir,
  sparkData,
  sparkColor,
  trendPositiveIsGood,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  sparkData: number[];
  sparkColor: string;
  trendPositiveIsGood?: boolean;
}) {
  const max = Math.max(...sparkData, 1);
  const min = Math.min(...sparkData, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-gray-500">{label}</span>
        </div>
        <TrendIcon dir={trendDir} positive={trendPositiveIsGood} />
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <svg width={w} height={h} className="w-full overflow-visible">
        <polyline
          fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

interface PerformanceMetricsProps {
  history: PerformanceSnapshot[];
  latest: PerformanceSnapshot | null;
  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;
  onToggleLive: () => void;
  onRefresh: () => void;
}

export function PerformanceMetrics({
  history,
  latest,
  loading,
  lastRefresh,
  isLive,
  onToggleLive,
  onRefresh,
}: PerformanceMetricsProps) {
  // Build chart data
  const chartData = useMemo(() => {
    // Show last ~60 data points for readable charts
    const slice = history.slice(-60);
    const labels = slice.map((p) => formatTime(p.timestamp));

    return {
      cpuMemory: {
        labels,
        datasets: [
          {
            label: 'CPU Usage %',
            data: slice.map((p) => p.cpuUsage),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Memory Usage %',
            data: slice.map((p) => p.memoryUsage),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      responseTime: {
        labels,
        datasets: [
          {
            label: 'Avg Response Time (ms)',
            data: slice.map((p) => p.avgResponseTime),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      requestRate: {
        labels,
        datasets: [
          {
            label: 'Requests/sec',
            data: slice.map((p) => p.requestRate),
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Error Rate %',
            data: slice.map((p) => p.errorRate),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y1',
          },
        ],
      },
    };
  }, [history]);

  const chartOptions = (title: string, yLabel: string, yMax?: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 } as const,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
      y: { min: 0, max: yMax, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } }, title: { display: true, text: yLabel, font: { size: 11 } } },
    },
  });

  const dualAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 } as const,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
      y: { min: 0, position: 'left' as const, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'Requests/sec', font: { size: 11 } } },
      y1: { min: 0, max: 15, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } }, title: { display: true, text: 'Error Rate %', font: { size: 11 } } },
    },
  };

  if (loading || !latest) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-48 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cpuData = history.map((p) => p.cpuUsage);
  const memData = history.map((p) => p.memoryUsage);
  const rtData = history.map((p) => p.avgResponseTime);
  const rrData = history.map((p) => p.requestRate);
  const erData = history.map((p) => p.errorRate);
  const acData = history.map((p) => p.activeConnections);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
          <p className="text-sm text-gray-500">Real-time CPU, memory, response times, and request rates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isLive
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={<Cpu className="h-4 w-4 text-blue-600" />}
          label="CPU" value={latest.cpuUsage} unit="%"
          trend={trend(cpuData)} sparkData={cpuData.slice(-20)} sparkColor="#3b82f6"
        />
        <KpiCard
          icon={<HardDrive className="h-4 w-4 text-green-600" />}
          label="Memory" value={latest.memoryUsage} unit="%"
          trend={trend(memData)} sparkData={memData.slice(-20)} sparkColor="#22c55e"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-amber-600" />}
          label="Response Time" value={Math.round(latest.avgResponseTime)} unit="ms"
          trend={trend(rtData)} sparkData={rtData.slice(-20)} sparkColor="#f59e0b"
        />
        <KpiCard
          icon={<Activity className="h-4 w-4 text-purple-600" />}
          label="Requests/sec" value={Math.round(latest.requestRate)} unit="rps"
          trend={trend(rrData)} sparkData={rrData.slice(-20)} sparkColor="#a855f7"
          trendPositiveIsGood
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          label="Error Rate" value={latest.errorRate.toFixed(1)} unit="%"
          trend={trend(erData)} sparkData={erData.slice(-20)} sparkColor="#ef4444"
        />
        <KpiCard
          icon={<Users className="h-4 w-4 text-cyan-600" />}
          label="Connections" value={latest.activeConnections} unit=""
          trend={trend(acData)} sparkData={acData.slice(-20)} sparkColor="#06b6d4"
          trendPositiveIsGood
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600" />
            CPU & Memory Usage
          </h3>
          <div className="h-64">
            <Line data={chartData.cpuMemory} options={chartOptions('CPU & Memory', 'Usage %', 100)} />
          </div>
        </div>

        {/* Response Time Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            Average Response Time
          </h3>
          <div className="h-64">
            <Line data={chartData.responseTime} options={chartOptions('Response Time', 'Time (ms)')} />
          </div>
        </div>
      </div>

      {/* Request Rate + Error Rate (dual axis) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-600" />
          Request Rate & Error Rate
        </h3>
        <div className="h-72">
          <Line data={chartData.requestRate} options={dualAxisOptions} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        Last updated: {lastRefresh.toLocaleTimeString()} {isLive && '• Auto-refreshing every 5s'}
      </div>
    </div>
  );
}
