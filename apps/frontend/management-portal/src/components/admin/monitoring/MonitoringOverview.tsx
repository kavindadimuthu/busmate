'use client';

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Server,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { SystemHealthSummary, PerformanceSnapshot, ResourceSnapshot, MonitoringAlert } from '@/data/admin/system-monitoring';

// ── Health Score Ring ─────────────────────────────────────────────

function HealthScoreRing({ score, status }: { score: number; status: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    status === 'healthy' ? '#22c55e' : status === 'degraded' ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-500 font-medium">Health Score</span>
      </div>
    </div>
  );
}

// ── Mini Sparkline ───────────────────────────────────────────────

function Sparkline({ data, color = '#3b82f6', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ── Quick Nav Card ───────────────────────────────────────────────

function QuickNavCard({
  href, icon, title, subtitle, stat, statColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  stat: string | number;
  statColor: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-0.5">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      <div className={`text-lg font-bold ${statColor}`}>{stat}</div>
    </Link>
  );
}

// ── Main Component ───────────────────────────────────────────────

interface MonitoringOverviewProps {
  healthSummary: SystemHealthSummary | null;
  performanceHistory: PerformanceSnapshot[];
  latestPerformance: PerformanceSnapshot | null;
  latestResource: ResourceSnapshot | null;
  activeAlerts: MonitoringAlert[];
  loading: boolean;
  lastRefresh: Date;
  isLive: boolean;
  apiEndpoints?: any[]; // Add proper type if known
  microservices?: any[]; // Add proper type if known
}

export function MonitoringOverview({
  healthSummary,
  performanceHistory,
  latestPerformance,
  latestResource,
  activeAlerts,
  loading,
  lastRefresh,
  isLive,
  apiEndpoints,
  microservices,
}: MonitoringOverviewProps) {
  if (loading || !healthSummary) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cpuSparkData = performanceHistory.slice(-20).map((p) => p.cpuUsage);
  const memSparkData = performanceHistory.slice(-20).map((p) => p.memoryUsage);
  const rtSparkData = performanceHistory.slice(-20).map((p) => p.avgResponseTime);
  const rrSparkData = performanceHistory.slice(-20).map((p) => p.requestRate);

  const statusColor = (s: string) =>
    s === 'healthy' ? 'text-green-600' : s === 'degraded' ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Health Score + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Health Score Card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center justify-center">
          <HealthScoreRing score={healthSummary.healthScore} status={healthSummary.overallStatus} />
          <div className={`mt-2 text-sm font-semibold capitalize ${statusColor(healthSummary.overallStatus)}`}>
            {healthSummary.overallStatus === 'healthy'
              ? 'All Systems Operational'
              : healthSummary.overallStatus === 'degraded'
              ? 'Degraded Performance'
              : 'Critical Issues Detected'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Uptime: {healthSummary.uptimePercentage}%
          </p>
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* CPU */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{healthSummary.currentCpu}%</div>
            <Sparkline data={cpuSparkData} color="#3b82f6" />
          </div>

          {/* Memory */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500">Memory</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{healthSummary.currentMemory}%</div>
            <Sparkline data={memSparkData} color="#22c55e" />
          </div>

          {/* Avg Response Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-gray-500">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{healthSummary.avgResponseTime}ms</div>
            <Sparkline data={rtSparkData} color="#f59e0b" />
          </div>

          {/* Request Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500">Requests/sec</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{healthSummary.requestRate}</div>
            <Sparkline data={rrSparkData} color="#a855f7" />
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickNavCard
            href="/admin/monitoring/performance"
            icon={<Activity className="h-5 w-5 text-blue-600" />}
            title="Performance Metrics"
            subtitle="CPU, memory, response times, request rates"
            stat={`${latestPerformance?.errorRate.toFixed(1)}% error rate`}
            statColor={
              latestPerformance && latestPerformance.errorRate > 2
                ? 'text-red-600'
                : 'text-green-600'
            }
          />
          <QuickNavCard
            href="/admin/monitoring/resources"
            icon={<Database className="h-5 w-5 text-purple-600" />}
            title="Resource Usage"
            subtitle="Disk, network, database, sessions"
            stat={`${latestResource?.diskUsage}% disk`}
            statColor={
              latestResource && latestResource.diskUsage > 80
                ? 'text-red-600'
                : 'text-green-600'
            }
          />
          <QuickNavCard
            href="/admin/monitoring/alerts"
            icon={<Bell className="h-5 w-5 text-amber-600" />}
            title="Alerts & Notifications"
            subtitle="Thresholds, rules, active alerts"
            stat={`${healthSummary.activeAlerts} active`}
            statColor={
              healthSummary.criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'
            }
          />
          <QuickNavCard
            href="/admin/monitoring/api"
            icon={<Globe className="h-5 w-5 text-green-600" />}
            title="API Monitoring"
            subtitle="Endpoints, response times, error rates"
            stat={`${healthSummary.healthyApis}/${healthSummary.totalApis} healthy`}
            statColor={
              healthSummary.downApis > 0 ? 'text-red-600' : 'text-green-600'
            }
          />
        </div>
      </div>

      {/* Active Alerts List */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Active Alerts ({activeAlerts.length})
            </h3>
            <Link
              href="/admin/monitoring/alerts"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeAlerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.source}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : alert.severity === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">API Status</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.healthyApis}</div>
              <div className="text-xs text-gray-500">Healthy</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.degradedApis}</div>
              <div className="text-xs text-gray-500">Degraded</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.downApis}</div>
              <div className="text-xs text-gray-500">Down</div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Services</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.healthyServices}</div>
              <div className="text-xs text-gray-500">Running</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.degradedServices}</div>
              <div className="text-xs text-gray-500">Degraded</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{healthSummary.downServices}</div>
              <div className="text-xs text-gray-500">Down</div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Active Alerts</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{healthSummary.criticalAlerts}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">{healthSummary.activeAlerts - healthSummary.criticalAlerts}</div>
              <div className="text-xs text-gray-500">Warning</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        Last updated: {lastRefresh.toLocaleTimeString()} {isLive && '• Auto-refreshing every 5s'}
      </div>
    </div>
  );
}
