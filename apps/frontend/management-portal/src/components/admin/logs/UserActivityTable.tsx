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
          className: 'bg-green-50 text-green-700 border border-green-200',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Success',
        };
      case 'error':
        return {
          className: 'bg-red-50 text-red-700 border border-red-200',
          icon: <XCircle className="h-3 w-3" />,
          label: 'Error',
        };
      case 'warning':
        return {
          className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Warning',
        };
      default:
        return {
          className: 'bg-gray-50 text-gray-700 border border-gray-200',
          icon: null,
          label: status,
        };
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const colors: Record<string, string> = {
      Administrator: 'bg-purple-50 text-purple-700 border-purple-200',
      Conductor: 'bg-blue-50 text-blue-700 border-blue-200',
      'Fleet Manager': 'bg-orange-50 text-orange-700 border-orange-200',
      Passenger: 'bg-green-50 text-green-700 border-green-200',
      'MOT Officer': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Timekeeper: 'bg-teal-50 text-teal-700 border-teal-200',
    };
    return colors[userType] || 'bg-gray-50 text-gray-700 border-gray-200';
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
          <Calendar className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No activity logs found</h3>
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
              onClick={() => onSort('userName')}
            >
              <div className="flex items-center gap-1">
                User <SortIcon field="userName" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('action')}
            >
              <div className="flex items-center gap-1">
                Action <SortIcon field="action" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Details
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Location
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-1">
                Status <SortIcon field="status" />
              </div>
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => onViewDetail(log.id)}
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-mono text-gray-600 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.userName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getUserTypeBadge(
                          log.userType
                        )}`}
                      >
                        {log.userType}
                      </span>
                      <span className="text-[10px] text-gray-400">{log.userId}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900">{log.action}</span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-600 max-w-xs truncate">{log.details}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Smartphone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{log.device}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
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
