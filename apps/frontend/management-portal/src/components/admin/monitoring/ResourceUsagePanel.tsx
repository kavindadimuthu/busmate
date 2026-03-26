'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Server,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { ResourceSnapshot } from '@/data/admin/system-monitoring';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

// ── Helpers ──────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProgressBar({ value, color, label, detail }: { value: number; color: string; label: string; detail?: string }) {
  const bgColor =
    value >= 85 ? 'bg-destructive' : value >= 70 ? 'bg-warning' : color;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          {detail && <span className="text-xs text-muted-foreground/70">{detail}</span>}
          <span className={`text-sm font-bold ${
            value >= 85 ? 'text-destructive' : value >= 70 ? 'text-warning' : 'text-foreground'
          }`}>{value}%</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function TrendIcon({ data }: { data: number[] }) {
  if (data.length < 3) return null;
  const recent = data.slice(-5);
  const prev = data.slice(-10, -5);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgPrev = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : avgRecent;
  const diff = ((avgRecent - avgPrev) / (avgPrev || 1)) * 100;

  if (diff > 3) return <TrendingUp className="h-3.5 w-3.5 text-destructive/80" />;
  if (diff < -3) return <TrendingDown className="h-3.5 w-3.5 text-success/80" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground/70" />;
}

// ── Main Component ───────────────────────────────────────────────

interface ResourceUsagePanelProps {
  history: ResourceSnapshot[];
  latest: ResourceSnapshot | null;
  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;
  onToggleLive: () => void;
  onRefresh: () => void;
}

export function ResourceUsagePanel({
  history,
  latest,
  loading,
  lastRefresh,
  isLive,
  onToggleLive,
  onRefresh,
}: ResourceUsagePanelProps) {
  const chartData = useMemo(() => {
    const slice = history.slice(-60);
    const labels = slice.map((r) => formatTime(r.timestamp));

    return {
      resources: {
        labels,
        datasets: [
          {
            label: 'CPU %',
            data: slice.map((r) => r.cpuUsage),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
          },
          {
            label: 'Memory %',
            data: slice.map((r) => r.memoryUsage),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.06)',
            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
          },
          {
            label: 'Disk %',
            data: slice.map((r) => r.diskUsage),
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.06)',
            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
          },
        ],
      },
      network: {
        labels,
        datasets: [
          {
            label: 'Inbound (Mbps)',
            data: slice.map((r) => r.networkInMbps),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: 'Outbound (Mbps)',
            data: slice.map((r) => r.networkOutMbps),
            backgroundColor: 'rgba(249, 115, 22, 0.7)',
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      dbSessions: {
        labels,
        datasets: [
          {
            label: 'DB Connections',
            data: slice.map((r) => r.dbConnections),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
          },
          {
            label: 'Active Sessions',
            data: slice.map((r) => r.activeSessions),
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.06)',
            fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
            yAxisID: 'y1',
          },
        ],
      },
    };
  }, [history]);

  const lineOptions = (yLabel: string, yMax?: number) => ({
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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 } as const,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, pointStyle: 'rect', boxWidth: 8, font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
      y: { min: 0, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'Mbps', font: { size: 11 } } },
    },
  };

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
      y: { min: 0, max: 100, position: 'left' as const, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'DB Connections', font: { size: 11 } } },
      y1: { min: 0, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } }, title: { display: true, text: 'Active Sessions', font: { size: 11 } } },
    },
  };

  if (loading || !latest) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="h-4 bg-secondary rounded w-1/4 mb-4" />
            <div className="h-48 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cpuData = history.map((r) => r.cpuUsage);
  const memData = history.map((r) => r.memoryUsage);
  const diskData = history.map((r) => r.diskUsage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Resource Usage</h2>
          <p className="text-sm text-muted-foreground">Database connections, disk space, network traffic, and more</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isLive
                ? 'bg-success/10 text-success border-success/20 hover:bg-success/15'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-secondary'}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">CPU</span>
            <TrendIcon data={cpuData} />
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.cpuUsage}%</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Memory</span>
            <TrendIcon data={memData} />
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.memoryUsedGB}GB</div>
          <div className="text-xs text-muted-foreground/70">of {latest.memoryTotalGB}GB</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-[hsl(var(--purple-600))]" />
            <span className="text-xs font-medium text-muted-foreground">Disk</span>
            <TrendIcon data={diskData} />
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.diskUsedGB}GB</div>
          <div className="text-xs text-muted-foreground/70">of {latest.diskTotalGB}GB</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-muted-foreground">Network In</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.networkInMbps}</div>
          <div className="text-xs text-muted-foreground/70">Mbps</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-muted-foreground">DB Connections</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.dbConnections}</div>
          <div className="text-xs text-muted-foreground/70">of {latest.dbMaxConnections}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary/90" />
            <span className="text-xs font-medium text-muted-foreground">Sessions</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{latest.activeSessions.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Current Utilization</h3>
        <div className="space-y-4">
          <ProgressBar
            value={latest.cpuUsage} color="bg-primary/80" label="CPU Usage"
            detail={`${latest.cpuUsage}% utilized`}
          />
          <ProgressBar
            value={latest.memoryUsage} color="bg-success" label="Memory Usage"
            detail={`${latest.memoryUsedGB}GB / ${latest.memoryTotalGB}GB`}
          />
          <ProgressBar
            value={latest.diskUsage} color="bg-[hsl(var(--purple-500))]" label="Disk Usage"
            detail={`${latest.diskUsedGB}GB / ${latest.diskTotalGB}GB`}
          />
          <ProgressBar
            value={Math.round((latest.dbConnections / latest.dbMaxConnections) * 100)}
            color="bg-indigo-500" label="Database Connections"
            detail={`${latest.dbConnections} / ${latest.dbMaxConnections}`}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU/Memory/Disk over time */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            CPU, Memory & Disk
          </h3>
          <div className="h-64">
            <Line data={chartData.resources} options={lineOptions('Usage %', 100)} />
          </div>
        </div>

        {/* Network */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-warning" />
            Network Traffic
          </h3>
          <div className="h-64">
            <Bar data={chartData.network} options={barOptions} />
          </div>
        </div>
      </div>

      {/* DB & Sessions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-[hsl(var(--purple-600))]" />
          Database Connections & Active Sessions
        </h3>
        <div className="h-64">
          <Line data={chartData.dbSessions} options={dualAxisOptions} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground/70">
        Last updated: {lastRefresh.toLocaleTimeString()} {isLive && '• Auto-refreshing every 5s'}
      </div>
    </div>
  );
}
