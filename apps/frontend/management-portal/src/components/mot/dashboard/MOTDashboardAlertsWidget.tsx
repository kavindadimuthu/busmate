'use client';

import { AlertTriangle, XCircle, Info, CheckCircle2, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';
import { AlertEntry } from '@/data/mot/dashboard';

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
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    dot: 'bg-red-500',
    border: 'border-l-red-500',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Info className="h-4 w-4 text-blue-500" />,
    dot: 'bg-blue-400',
    border: 'border-l-blue-400',
  },
};

interface MOTDashboardAlertsWidgetProps {
  alerts: AlertEntry[];
  loading?: boolean;
  onAcknowledge?: (alertId: string) => void;
}

export function MOTDashboardAlertsWidget({ alerts, loading = false, onAcknowledge }: MOTDashboardAlertsWidgetProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">System Alerts</h3>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  {warningCount}
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href="/mot/notifications"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Alert list */}
      {unacknowledgedAlerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <CheckCircle2 className="h-10 w-10 text-green-400 mb-2" />
          <p className="text-sm text-gray-600">All clear</p>
          <p className="text-xs text-gray-400">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-auto">
          {unacknowledgedAlerts.slice(0, 4).map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 bg-gray-50 ${style.border}`}
              >
                <div className="flex items-start gap-2">
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400">{alert.source}</span>
                      {onAcknowledge && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
