'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
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
import { ApiEndpointMetric, MicroserviceInfo } from '@/data/admin/system-monitoring';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// ── Helpers ──────────────────────────────────────────────────────

function statusDot(status: string) {
  const map: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
    up: 'bg-green-500',
    slow: 'bg-amber-500',
    error: 'bg-red-500',
  };
  return map[status] ?? 'bg-gray-400';
}

function uptimeColor(pct: number) {
  if (pct >= 99.9) return 'text-green-600';
  if (pct >= 99) return 'text-amber-600';
  return 'text-red-600';
}

function methodBadge(method: string) {
  const map: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-purple-100 text-purple-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return map[method] ?? 'bg-gray-100 text-gray-700';
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// ── Microservice Card ────────────────────────────────────────────

function ServiceCard({
  service,
  onRestart,
}: {
  service: MicroserviceInfo;
  onRestart: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusStyles: Record<string, { bg: string; text: string }> = {
    healthy: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
    degraded: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    down: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  };

  const s = statusStyles[service.status] ?? statusStyles.healthy;

  return (
    <div className={`rounded-xl border ${s.bg} transition-all hover:shadow-sm`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <Server className={`h-5 w-5 ${s.text}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{service.name}</p>
          <p className="text-xs text-gray-500">{service.version} • Port {service.port}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusDot(service.status)}`} />
          <span className={`text-xs font-medium ${s.text}`}>{service.status}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100/50 pt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400">CPU</span>
              <p className="font-medium text-gray-700">{service.cpuUsage.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-400">Memory</span>
              <p className="font-medium text-gray-700">{service.memoryUsedMB.toFixed(0)} MB</p>
            </div>
            <div>
              <span className="text-gray-400">Uptime</span>
              <p className="font-medium text-gray-700">{service.uptime}</p>
            </div>
            <div>
              <span className="text-gray-400">Instances</span>
              <p className="font-medium text-gray-700">{service.instances}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Avg Response</span>
              <p className="font-medium text-gray-700">{service.memoryUsage.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-400">Tags</span>
              <p className="font-medium text-gray-700">{service.tags.join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-400">Last Restart</span>
              <p className="font-medium text-gray-700">
                {new Date(service.lastRestart).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {service.status !== 'healthy' && (
            <button
              onClick={(e) => { e.stopPropagation(); onRestart(service.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restart Service
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

type ApiTab = 'endpoints' | 'services';

interface ApiMonitoringPanelProps {
  apiEndpoints: ApiEndpointMetric[];
  microservices: MicroserviceInfo[];
  loading: boolean;
  onRestartService: (id: string) => Promise<void>;
}

export function ApiMonitoringPanel({
  apiEndpoints,
  microservices,
  loading,
  onRestartService,
}: ApiMonitoringPanelProps) {
  const [tab, setTab] = useState<ApiTab>('endpoints');
  const [sortField, setSortField] = useState<'endpoint' | 'avgResponseTime' | 'errorRate' | 'uptime'>('endpoint');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedEndpoints = useMemo(() => {
    return [...apiEndpoints].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'endpoint') cmp = a.endpoint.localeCompare(b.endpoint);
      else if (sortField === 'avgResponseTime') cmp = a.avgResponseTime - b.avgResponseTime;
      else if (sortField === 'errorRate') cmp = a.errorRate - b.errorRate;
      else cmp = a.uptime - b.uptime;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [apiEndpoints, sortField, sortDir]);

  function handleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  // Chart: Average response time for top 6 endpoints
  const responseChartData = useMemo(() => {
    const top = [...apiEndpoints].sort((a, b) => b.requestCount24h - a.requestCount24h).slice(0, 6);
    return {
      labels: top.map((e) => e.endpoint.length > 30 ? e.endpoint.slice(0, 28) + '…' : e.endpoint),
      datasets: [
        {
          label: 'Avg (ms)',
          data: top.map((e) => e.avgResponseTime),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
        {
          label: 'p95 (ms)',
          data: top.map((e) => e.p95ResponseTime),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    };
  }, [apiEndpoints]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'ms' }, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Summary stats
  const avgUptime = apiEndpoints.reduce((s, e) => s + e.uptime, 0) / apiEndpoints.length;
  const avgResponse = apiEndpoints.reduce((s, e) => s + e.avgResponseTime, 0) / apiEndpoints.length;
  const totalReqs = apiEndpoints.reduce((s, e) => s + e.requestCount24h, 0);
  const healthyServices = microservices.filter((s) => s.status === 'healthy').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">API Monitoring</h2>
        <p className="text-sm text-gray-500">Track API endpoint performance and microservice health</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500">Avg Uptime</span>
          </div>
          <div className={`text-2xl font-bold ${uptimeColor(avgUptime)}`}>
            {avgUptime.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500">Avg Response</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatMs(avgResponse)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-500">Requests (24h)</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{totalReqs.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-medium text-gray-500">Services Up</span>
          </div>
          <div className="text-2xl font-bold text-teal-600">
            {healthyServices}/{microservices.length}
          </div>
        </div>
      </div>

      {/* Response-time chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Response Times — Top Endpoints</h3>
        <div className="h-64">
          <Line data={responseChartData} options={chartOptions} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('endpoints')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'endpoints' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          Endpoints
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            tab === 'endpoints' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
          }`}>{apiEndpoints.length}</span>
        </button>
        <button
          onClick={() => setTab('services')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'services' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Server className="h-4 w-4" />
          Microservices
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            tab === 'services' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
          }`}>{microservices.length}</span>
        </button>
      </div>

      {/* Endpoints Table */}
      {tab === 'endpoints' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('endpoint')}
                  >
                    Endpoint <SortIcon field="endpoint" />
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('avgResponseTime')}
                  >
                    Avg <SortIcon field="avgResponseTime" />
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">p95</th>
                  <th
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('errorRate')}
                  >
                    Error % <SortIcon field="errorRate" />
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">RPM</th>
                  <th
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('uptime')}
                  >
                    Uptime <SortIcon field="uptime" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedEndpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${methodBadge(ep.method)}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{ep.endpoint}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusDot(ep.status)}`} />
                        <span className="text-xs text-gray-600">{ep.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{formatMs(ep.avgResponseTime)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatMs(ep.p95ResponseTime)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${ep.errorRate > 5 ? 'text-red-600' : ep.errorRate > 1 ? 'text-amber-600' : 'text-green-600'}`}>
                        {ep.errorRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{ep.requestCount24h.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${uptimeColor(ep.uptime)}`}>
                        {ep.uptime.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Microservices */}
      {tab === 'services' && (
        <div className="space-y-3">
          {microservices.map((svc) => (
            <ServiceCard key={svc.id} service={svc} onRestart={onRestartService} />
          ))}
        </div>
      )}
    </div>
  );
}
