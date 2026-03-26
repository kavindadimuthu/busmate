'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { ActiveAlertEntry } from '@/data/admin/dashboard-v2';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SEVERITY_STYLES = {
  critical: {
    badge: 'bg-destructive/15 text-destructive border-destructive/20',
    icon: <XCircle className="h-4 w-4 text-destructive/80" />,
    dot: 'bg-destructive',
    border: 'border-l-red-500',
  },
  warning: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    icon: <AlertTriangle className="h-4 w-4 text-warning/80" />,
    dot: 'bg-warning',
    border: 'border-l-amber-500',
  },
  info: {
    badge: 'bg-primary/15 text-primary border-primary/20',
    icon: <CheckCircle2 className="h-4 w-4 text-primary/80" />,
    dot: 'bg-primary/50',
    border: 'border-l-blue-400',
  },
};

interface DashboardAlertsWidgetProps {
  alerts: ActiveAlertEntry[];
  loading?: boolean;
}

export function DashboardAlertsWidget({ alerts, loading = false }: DashboardAlertsWidgetProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount  = alerts.filter((a) => a.severity === 'warning').length;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-28 mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-3 h-14 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Active Alerts</h3>
        </div>
        <Link
          href="/admin/monitoring/alerts"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20">
            {criticalCount} Critical
          </span>
        )}
        {warningCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/20">
            {warningCount} Warning
          </span>
        )}
        {alerts.length === 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
            All Clear
          </span>
        )}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success/70 mb-2" />
          <p className="text-sm text-muted-foreground">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-2 bg-muted ${style.border}`}
              >
                <div className="mt-0.5 shrink-0">{style.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{alert.source}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(alert.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
