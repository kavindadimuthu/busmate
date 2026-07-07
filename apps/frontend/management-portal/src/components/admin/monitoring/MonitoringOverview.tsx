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
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  CardSkeleton,
} from '@busmate/ui';
import { SystemHealthSummary, PerformanceSnapshot, ResourceSnapshot, MonitoringAlert } from '@/data/admin/systemMonitoring';

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
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">Health Score</span>
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
    <Link href={href} className="group block">
      <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              {icon}
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-semibold text-foreground mb-0.5">{title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
          <div className={`text-lg font-bold ${statColor}`}>{stat}</div>
        </CardContent>
      </Card>
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
  apiEndpoints?: any[];
  microservices?: any[];
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
}: MonitoringOverviewProps) {
  if (loading || !healthSummary) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cpuSparkData = performanceHistory.slice(-20).map((p) => p.cpuUsage);
  const memSparkData = performanceHistory.slice(-20).map((p) => p.memoryUsage);
  const rtSparkData = performanceHistory.slice(-20).map((p) => p.avgResponseTime);
  const rrSparkData = performanceHistory.slice(-20).map((p) => p.requestRate);

  const statusColor = (s: string) =>
    s === 'healthy' ? 'text-success' : s === 'degraded' ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* Health Score + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Health Score Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center p-5">
            <HealthScoreRing score={healthSummary.healthScore} status={healthSummary.overallStatus} />
            <div className={`mt-2 text-sm font-semibold capitalize ${statusColor(healthSummary.overallStatus)}`}>
              {healthSummary.overallStatus === 'healthy'
                ? 'All Systems Operational'
                : healthSummary.overallStatus === 'degraded'
                ? 'Degraded Performance'
                : 'Critical Issues Detected'}
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Uptime: {healthSummary.uptimePercentage}%
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">CPU Usage</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{healthSummary.currentCpu}%</div>
              <Sparkline data={cpuSparkData} color="#3b82f6" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-muted-foreground">Memory</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{healthSummary.currentMemory}%</div>
              <Sparkline data={memSparkData} color="#22c55e" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground">Avg Response</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{healthSummary.avgResponseTime}ms</div>
              <Sparkline data={rtSparkData} color="#f59e0b" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--purple-600))]" />
                <span className="text-xs font-medium text-muted-foreground">Requests/sec</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{healthSummary.requestRate}</div>
              <Sparkline data={rrSparkData} color="#a855f7" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation */}
      <div>
        <h3 className="text-sm font-semibold text-foreground/80 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickNavCard
            href="/admin/monitoring?tab=performance"
            icon={<Activity className="h-5 w-5 text-primary" />}
            title="Performance Metrics"
            subtitle="CPU, memory, response times, request rates"
            stat={`${latestPerformance?.errorRate.toFixed(1)}% error rate`}
            statColor={
              latestPerformance && latestPerformance.errorRate > 2
                ? 'text-destructive'
                : 'text-success'
            }
          />
          <QuickNavCard
            href="/admin/monitoring?tab=resources"
            icon={<Database className="h-5 w-5 text-[hsl(var(--purple-600))]" />}
            title="Resource Usage"
            subtitle="Disk, network, database, sessions"
            stat={`${latestResource?.diskUsage}% disk`}
            statColor={
              latestResource && latestResource.diskUsage > 80
                ? 'text-destructive'
                : 'text-success'
            }
          />
          <QuickNavCard
            href="/admin/monitoring?tab=alerts"
            icon={<Bell className="h-5 w-5 text-warning" />}
            title="Alerts & Notifications"
            subtitle="Thresholds, rules, active alerts"
            stat={`${healthSummary.activeAlerts} active`}
            statColor={
              healthSummary.criticalAlerts > 0 ? 'text-destructive' : 'text-success'
            }
          />
          <QuickNavCard
            href="/admin/monitoring?tab=api"
            icon={<Globe className="h-5 w-5 text-success" />}
            title="API Monitoring"
            subtitle="Endpoints, response times, error rates"
            stat={`${healthSummary.healthyApis}/${healthSummary.totalApis} healthy`}
            statColor={
              healthSummary.downApis > 0 ? 'text-destructive' : 'text-success'
            }
          />
        </div>
      </div>

      {/* Active Alerts List */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/50">
            <CardTitle className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning/80" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
            <Link
              href="/admin/monitoring?tab=alerts"
              className="text-xs text-primary hover:text-primary font-medium"
            >
              View All →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {activeAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === 'critical'
                      ? 'bg-destructive'
                      : alert.severity === 'warning'
                      ? 'bg-warning'
                      : 'bg-primary/80'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.source}</p>
                  </div>
                  <Badge
                    variant={
                      alert.severity === 'critical'
                        ? 'destructive'
                        : alert.severity === 'warning'
                        ? 'outline'
                        : 'secondary'
                    }
                    className={
                      alert.severity === 'warning'
                        ? 'bg-warning/15 text-warning border-warning/20'
                        : alert.severity === 'info'
                        ? 'bg-primary/15 text-primary'
                        : ''
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Status */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-primary" />
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.healthyApis}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-warning/80 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.degradedApis}</div>
                <div className="text-xs text-muted-foreground">Degraded</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-destructive/80 mb-1">
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.downApis}</div>
                <div className="text-xs text-muted-foreground">Down</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-5 w-5 text-[hsl(var(--purple-600))]" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.healthyServices}</div>
                <div className="text-xs text-muted-foreground">Running</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-warning/80 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.degradedServices}</div>
                <div className="text-xs text-muted-foreground">Degraded</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-destructive/80 mb-1">
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{healthSummary.downServices}</div>
                <div className="text-xs text-muted-foreground">Down</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-destructive" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-destructive">{healthSummary.criticalAlerts}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning/80">{healthSummary.activeAlerts - healthSummary.criticalAlerts}</div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground/70">
        Last updated: {lastRefresh.toLocaleTimeString()} {isLive && '• Auto-refreshing every 5s'}
      </div>
    </div>
  );
}
