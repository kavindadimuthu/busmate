'use client';

import {
  Shield,
  AlertTriangle,
  XCircle,
  Lock,
  Eye,
  LogIn,
  LogOut,
  Key,
  UserCog,
  ChevronUp,
  ChevronDown,
  Globe,
} from 'lucide-react';
import type { SecurityLog } from '@/data/admin/types';

interface SecurityLogsTableProps {
  logs: SecurityLog[];
  loading?: boolean;
  onViewDetail: (logId: string) => void;
  currentSort: { field: string; direction: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function SecurityLogsTable({
  logs,
  loading = false,
  onViewDetail,
  currentSort,
  onSort,
}: SecurityLogsTableProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          className: 'bg-destructive text-white',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Critical',
        };
      case 'high':
        return {
          className: 'bg-destructive/10 text-destructive border border-destructive/20',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'High',
        };
      case 'medium':
        return {
          className: 'bg-warning/10 text-warning border border-warning/20',
          icon: <Eye className="h-3 w-3" />,
          label: 'Medium',
        };
      case 'low':
        return {
          className: 'bg-success/10 text-success border border-success/20',
          icon: <Lock className="h-3 w-3" />,
          label: 'Low',
        };
      default:
        return {
          className: 'bg-muted text-foreground/80 border border-border',
          icon: <Shield className="h-3 w-3" />,
          label: severity,
        };
    }
  };

  const getEventTypeInfo = (eventType: string) => {
    const types: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      login: { icon: <LogIn className="h-3.5 w-3.5" />, label: 'Login', color: 'text-success' },
      logout: { icon: <LogOut className="h-3.5 w-3.5" />, label: 'Logout', color: 'text-muted-foreground' },
      failed_login: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Failed Login', color: 'text-destructive' },
      password_change: { icon: <Key className="h-3.5 w-3.5" />, label: 'Password Change', color: 'text-primary' },
      permission_change: { icon: <UserCog className="h-3.5 w-3.5" />, label: 'Permission Change', color: 'text-[hsl(var(--purple-600))]' },
      suspicious_activity: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Suspicious Activity', color: 'text-warning' },
    };
    return types[eventType] || { icon: <Shield className="h-3.5 w-3.5" />, label: eventType, color: 'text-muted-foreground' };
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (currentSort.field !== field) {
      return <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    return currentSort.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-muted-foreground/70 mb-2">
          <Shield className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No security logs found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-muted border-b border-border">
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
              onClick={() => onSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Timestamp <SortIcon field="timestamp" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
              onClick={() => onSort('severity')}
            >
              <div className="flex items-center gap-1">
                Severity <SortIcon field="severity" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
              onClick={() => onSort('eventType')}
            >
              <div className="flex items-center gap-1">
                Event Type <SortIcon field="eventType" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Source
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              User
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => {
            const severity = getSeverityBadge(log.severity);
            const eventInfo = getEventTypeInfo(log.eventType);
            return (
              <tr
                key={log.id}
                className={`hover:bg-primary/10/30 transition-colors cursor-pointer ${
                  log.severity === 'critical' ? 'bg-destructive/10/20' : ''
                }`}
                onClick={() => onViewDetail(log.id)}
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severity.className}`}
                  >
                    {severity.icon}
                    {severity.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className={`flex items-center gap-1.5 ${eventInfo.color}`}>
                    {eventInfo.icon}
                    <span className="text-sm font-medium">{eventInfo.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-muted-foreground max-w-sm truncate">{log.details}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 max-w-[200px] truncate">
                      {log.userAgent}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {log.userName ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.userName}</p>
                      <p className="text-[10px] text-muted-foreground/70">{log.userId}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/70">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(log.id);
                    }}
                    className="p-1.5 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {loading && logs.length > 0 && (
        <div className="flex items-center justify-center py-4 border-t border-border/50">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
}
