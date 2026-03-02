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
          className: 'bg-red-600 text-white',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Critical',
        };
      case 'high':
        return {
          className: 'bg-red-50 text-red-700 border border-red-200',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'High',
        };
      case 'medium':
        return {
          className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
          icon: <Eye className="h-3 w-3" />,
          label: 'Medium',
        };
      case 'low':
        return {
          className: 'bg-green-50 text-green-700 border border-green-200',
          icon: <Lock className="h-3 w-3" />,
          label: 'Low',
        };
      default:
        return {
          className: 'bg-gray-50 text-gray-700 border border-gray-200',
          icon: <Shield className="h-3 w-3" />,
          label: severity,
        };
    }
  };

  const getEventTypeInfo = (eventType: string) => {
    const types: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      login: { icon: <LogIn className="h-3.5 w-3.5" />, label: 'Login', color: 'text-green-600' },
      logout: { icon: <LogOut className="h-3.5 w-3.5" />, label: 'Logout', color: 'text-gray-500' },
      failed_login: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Failed Login', color: 'text-red-600' },
      password_change: { icon: <Key className="h-3.5 w-3.5" />, label: 'Password Change', color: 'text-blue-600' },
      permission_change: { icon: <UserCog className="h-3.5 w-3.5" />, label: 'Permission Change', color: 'text-purple-600' },
      suspicious_activity: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Suspicious Activity', color: 'text-orange-600' },
    };
    return types[eventType] || { icon: <Shield className="h-3.5 w-3.5" />, label: eventType, color: 'text-gray-600' };
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (currentSort.field !== field) {
      return <ChevronUp className="w-3.5 h-3.5 text-gray-300" />;
    }
    return currentSort.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-gray-400 mb-2">
          <Shield className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No security logs found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Timestamp <SortIcon field="timestamp" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('severity')}
            >
              <div className="flex items-center gap-1">
                Severity <SortIcon field="severity" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('eventType')}
            >
              <div className="flex items-center gap-1">
                Event Type <SortIcon field="eventType" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Details
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Source
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              User
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                  log.severity === 'critical' ? 'bg-red-50/20' : ''
                }`}
                onClick={() => onViewDetail(log.id)}
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-gray-600 whitespace-nowrap">
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
                  <p className="text-sm text-gray-600 max-w-sm truncate">{log.details}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 max-w-[200px] truncate">
                      {log.userAgent}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {log.userName ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                      <p className="text-[10px] text-gray-400">{log.userId}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(log.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
        <div className="flex items-center justify-center py-4 border-t border-gray-100">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
}
