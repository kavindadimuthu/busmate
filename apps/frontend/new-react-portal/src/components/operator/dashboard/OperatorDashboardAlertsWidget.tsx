'use client';

import { AlertTriangle, XCircle, Info, CheckCircle2, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';
import { AlertEntry } from '@/data/operator/dashboard';

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
    icon: <XCircle className="h-4 w-4 text-destructive/80 shrink-0" />,
    border: 'border-l-red-500',
  },
  warning: {
    badge: 'bg-warning/15 text-warning border-warning/20',
    icon: <AlertTriangle className="h-4 w-4 text-warning/80 shrink-0" />,
    border: 'border-l-amber-500',
  },
  info: {
    badge: 'bg-primary/15 text-primary border-primary/20',
    icon: <Info className="h-4 w-4 text-primary/70 shrink-0" />,
    border: 'border-l-blue-400',
  },
};

interface OperatorDashboardAlertsWidgetProps {
  alerts: AlertEntry[];
  loading?: boolean;
  onAcknowledge?: (alertId: string) => void;
}

export function OperatorDashboardAlertsWidget({
  alerts,
  loading = false,
  onAcknowledge,
}: OperatorDashboardAlertsWidgetProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length;
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-28 bg-muted rounded mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Operational Alerts</h3>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/15 text-destructive">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/15 text-warning">
                  {warningCount}
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href="/operator/notifications"
          className="text-xs text-primary hover:text-primary flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Alert list */}
      {unacknowledged.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <CheckCircle2 className="h-10 w-10 text-success/70 mb-2" />
          <p className="text-sm text-muted-foreground">All clear</p>
          <p className="text-xs text-muted-foreground">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-auto">
          {unacknowledged.slice(0, 4).map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 bg-muted ${style.border}`}
              >
                <div className="flex items-start gap-2">
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">{alert.title}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(alert.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{alert.source}</span>
                      {onAcknowledge && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary font-medium"
                        >
                          <Check className="h-3 w-3" />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
