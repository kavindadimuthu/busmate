'use client';

import {
  Terminal,
  AlertTriangle,
  XCircle,
  Info,
  Bug,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Server,
} from 'lucide-react';
import { useState } from 'react';
import type { ApplicationLog } from '@/data/admin/types';

interface ApplicationLogsTableProps {
  logs: ApplicationLog[];
  loading?: boolean;
  onViewDetail: (logId: string) => void;
  currentSort: { field: string; direction: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function ApplicationLogsTable({
  logs,
  loading = false,
  onViewDetail,
  currentSort,
  onSort,
}: ApplicationLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return {
          className: 'bg-red-50 text-red-700 border border-red-200',
          icon: <XCircle className="h-3 w-3" />,
        };
      case 'WARN':
        return {
          className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case 'INFO':
        return {
          className: 'bg-blue-50 text-blue-700 border border-blue-200',
          icon: <Info className="h-3 w-3" />,
        };
      case 'DEBUG':
        return {
          className: 'bg-gray-50 text-gray-600 border border-gray-200',
          icon: <Bug className="h-3 w-3" />,
        };
      default:
        return {
          className: 'bg-gray-50 text-gray-600 border border-gray-200',
          icon: <Terminal className="h-3 w-3" />,
        };
    }
  };

  const serviceColors: Record<string, string> = {
    'route-management': 'bg-blue-100 text-blue-700',
    'ticketing-management': 'bg-purple-100 text-purple-700',
    'user-management': 'bg-green-100 text-green-700',
    'location-tracking': 'bg-orange-100 text-orange-700',
    'notification-service': 'bg-teal-100 text-teal-700',
    'payment-service': 'bg-pink-100 text-pink-700',
    'analytics-service': 'bg-indigo-100 text-indigo-700',
    'api-gateway': 'bg-cyan-100 text-cyan-700',
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
          <Terminal className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No application logs found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-8" />
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
              onClick={() => onSort('level')}
            >
              <div className="flex items-center gap-1">
                Level <SortIcon field="level" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('service')}
            >
              <div className="flex items-center gap-1">
                Service <SortIcon field="service" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Message
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => {
            const level = getLevelBadge(log.level);
            const isExpanded = expandedRows.has(log.id);
            const hasExpandableContent = log.stackTrace || (log.metadata && Object.keys(log.metadata).length > 0);

            return (
              <tr key={log.id} className="group">
                <td colSpan={6} className="p-0">
                  <div
                    className={`hover:bg-blue-50/30 transition-colors ${
                      log.level === 'ERROR' ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Expand toggle */}
                      <div className="py-3 px-4 w-8 flex-shrink-0">
                        {hasExpandableContent ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(log.id);
                            }}
                            className="p-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                        ) : (
                          <span className="w-3.5" />
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="py-3 px-4 min-w-[160px]">
                        <span className="text-sm font-mono text-gray-600 whitespace-nowrap">
                          {log.timestamp}
                        </span>
                      </div>

                      {/* Level */}
                      <div className="py-3 px-4 min-w-[90px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${level.className}`}
                        >
                          {level.icon}
                          {log.level}
                        </span>
                      </div>

                      {/* Service */}
                      <div className="py-3 px-4 min-w-[160px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            serviceColors[log.service] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Server className="h-3 w-3 shrink-0" />
                          {log.service}
                        </span>
                      </div>

                      {/* Message */}
                      <div className="py-3 px-4 flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate max-w-lg">{log.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="py-3 px-4 text-center flex-shrink-0">
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
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && hasExpandableContent && (
                      <div className="px-12 pb-4 space-y-3 border-t border-gray-100 bg-gray-50/50">
                        {log.stackTrace && (
                          <div className="mt-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Stack Trace
                            </h4>
                            <pre className="text-xs font-mono text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap">
                              {log.stackTrace}
                            </pre>
                          </div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Metadata
                            </h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-gray-500 font-medium">{key}:</span>{' '}
                                    <span className="text-gray-900 font-mono">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
