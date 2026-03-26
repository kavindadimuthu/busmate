'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import {
  LogStatsCards,
  LogTrendChart,
} from '@/components/admin/logs';
import {
  getLogStats,
  getUserActivityLogs,
  getSecurityLogs,
  getApplicationLogs,
} from '@/data/admin';
import {
  ArrowRight,
  Activity,
  Shield,
  Terminal,
  AlertTriangle,
} from 'lucide-react';

export default function LogsOverviewPage() {
  useSetPageMetadata({
    title: 'System Logs',
    description: 'Overview of all system logging activity and trends',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs' }],
  });

  const router = useRouter();
  const [loading] = useState(false);

  const stats = useMemo(() => getLogStats(), []);
  const recentUserActivity = useMemo(() => getUserActivityLogs(5), []);
  const recentSecurity = useMemo(
    () => getSecurityLogs().filter((l) => l.severity === 'critical' || l.severity === 'high').slice(0, 5),
    []
  );
  const recentErrors = useMemo(
    () => getApplicationLogs().filter((l) => l.level === 'ERROR').slice(0, 5),
    []
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <LogStatsCards stats={stats} loading={loading} />

      {/* Trend Chart */}
      <LogTrendChart stats={stats} loading={loading} />

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Security Events */}
        <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-warning/10 rounded-lg">
                <Shield className="h-4 w-4 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Critical Security</h3>
            </div>
            <button
              onClick={() => router.push('/admin/logs/listing?tab=security')}
              className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentSecurity.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentSecurity.map((log) => (
                <div
                  key={log.id}
                  className="p-3 hover:bg-warning/10/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/logs/${log.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        log.severity === 'critical' ? 'text-destructive/80' : 'text-warning/80'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            log.severity === 'critical'
                              ? 'bg-destructive text-white'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {log.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No critical security events
            </div>
          )}
        </div>

        {/* Recent Errors */}
        <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <Terminal className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Recent Errors</h3>
            </div>
            <button
              onClick={() => router.push('/admin/logs/listing?tab=application')}
              className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentErrors.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentErrors.map((log) => (
                <div
                  key={log.id}
                  className="p-3 hover:bg-destructive/10/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/logs/${log.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]">
                        {log.service}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No recent errors</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-success/10 rounded-lg">
                <Activity className="h-4 w-4 text-success" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            <button
              onClick={() => router.push('/admin/logs/listing?tab=user-activity')}
              className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentUserActivity.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentUserActivity.map((log) => (
                <div
                  key={log.id}
                  className="p-3 hover:bg-success/10/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/logs/${log.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-medium">{log.userName}</span>{' '}
                      <span className="text-muted-foreground">{log.action}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          log.status === 'success'
                            ? 'bg-success/10 text-success'
                            : log.status === 'error'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">No recent activity</div>
          )}
        </div>
      </div>

      {/* Top Actions & Top Services Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Top User Actions
          </h3>
          <div className="space-y-3">
            {stats.topActions.map((item, idx) => {
              const maxCount = stats.topActions[0]?.count || 1;
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground/80">{item.action}</span>
                    <span className="text-sm font-semibold text-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Service Error Rates
          </h3>
          <div className="space-y-3">
            {stats.topServices.map((item, idx) => {
              const errorRate = item.totalCount > 0 ? ((item.errorCount / item.totalCount) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-[hsl(var(--purple-50))] rounded">
                      <Terminal className="h-3.5 w-3.5 text-[hsl(var(--purple-600))]" />
                    </div>
                    <span className="text-sm text-foreground/80">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{item.totalCount} total</span>
                    <span className={`font-medium ${item.errorCount > 0 ? 'text-destructive' : 'text-success'}`}>
                      {item.errorCount} errors ({errorRate}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
