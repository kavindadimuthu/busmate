'use client';

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Smartphone,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { UserActivityLog } from '@/data/admin/types';

interface UserActivityTableProps {
  logs: UserActivityLog[];
  loading?: boolean;
  onViewDetail: (logId: string) => void;
  currentSort: { field: string; direction: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function UserActivityTable({
  logs,
  loading = false,
  onViewDetail,
  currentSort,
  onSort,
}: UserActivityTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return {
          className: 'bg-success/10 text-success border border-success/20',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Success',
        };
      case 'error':
        return {
          className: 'bg-destructive/10 text-destructive border border-destructive/20',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Error',
        };
      case 'warning':
        return {
          className: 'bg-warning/10 text-warning border border-warning/20',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Warning',
        };
      default:
        return {
          className: 'bg-muted text-foreground/80 border border-border',
          icon: null,
          label: status,
        };
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const colors: Record<string, string> = {
      Administrator: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]',
      Conductor: 'bg-primary/10 text-primary border-primary/20',
      'Fleet Manager': 'bg-warning/10 text-orange-700 border-orange-200',
      Passenger: 'bg-success/10 text-success border-success/20',
      'MOT Officer': 'bg-primary/10 text-indigo-700 border-indigo-200',
      Timekeeper: 'bg-primary/10 text-teal-700 border-teal-200',
    };
    return colors[userType] || 'bg-muted text-foreground/80 border-border';
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
          <Calendar className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No activity logs found</h3>
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
              onClick={() => onSort('userName')}
            >
              <div className="flex items-center gap-1">
                User <SortIcon field="userName" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
              onClick={() => onSort('action')}
            >
              <div className="flex items-center gap-1">
                Action <SortIcon field="action" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Location
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-1">
                Status <SortIcon field="status" />
              </div>
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => {
            const status = getStatusBadge(log.status);
            return (
              <tr
                key={log.id}
                className="hover:bg-primary/10/30 transition-colors cursor-pointer"
                onClick={() => onViewDetail(log.id)}
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{log.userName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getUserTypeBadge(
                          log.userType
                        )}`}
                      >
                        {log.userType}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">{log.userId}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-muted-foreground max-w-xs truncate">{log.details}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Smartphone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{log.device}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{log.location}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
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
