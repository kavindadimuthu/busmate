'use client';

import {
  Bell,
  Send,
  Clock,
  FileEdit,
  AlertTriangle,
  CheckCircle,
  Info,
  Wrench,
  XCircle,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  Mail,
  Smartphone,
} from 'lucide-react';
import type { Notification } from '@/data/admin/types';

interface NotificationTableProps {
  notifications: Notification[];
  loading?: boolean;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  currentSort: { field: string; direction: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function NotificationTable({
  notifications,
  loading = false,
  onView,
  onDelete,
  currentSort,
  onSort,
}: NotificationTableProps) {
  // ── helpers ──────────────────────────────────────

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

  const getTypeStyle = (type: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      info: {
        cls: 'bg-blue-50 text-blue-700 border border-blue-200',
        icon: <Info className="h-3 w-3" />,
        label: 'Info',
      },
      warning: {
        cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Warning',
      },
      critical: {
        cls: 'bg-red-50 text-red-700 border border-red-200',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Critical',
      },
      success: {
        cls: 'bg-green-50 text-green-700 border border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Success',
      },
      maintenance: {
        cls: 'bg-purple-50 text-purple-700 border border-purple-200',
        icon: <Wrench className="h-3 w-3" />,
        label: 'Maintenance',
      },
      error: {
        cls: 'bg-red-50 text-red-700 border border-red-200',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Error',
      },
    };
    return map[type] || map.info;
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      sent: {
        cls: 'bg-green-50 text-green-700 border border-green-200',
        icon: <Send className="h-3 w-3" />,
        label: 'Sent',
      },
      scheduled: {
        cls: 'bg-amber-50 text-amber-700 border border-amber-200',
        icon: <Clock className="h-3 w-3" />,
        label: 'Scheduled',
      },
      draft: {
        cls: 'bg-gray-100 text-gray-600 border border-gray-200',
        icon: <FileEdit className="h-3 w-3" />,
        label: 'Draft',
      },
      failed: {
        cls: 'bg-red-50 text-red-700 border border-red-200',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Failed',
      },
    };
    return map[status] || map.draft;
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-gray-400',
    };
    return colors[priority] || colors.low;
  };

  const getAudienceLabel = (audience: string) =>
    audience
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3.5 w-3.5 text-gray-500" />;
      case 'sms':
        return <Smartphone className="h-3.5 w-3.5 text-gray-500" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const readRate = (n: Notification) => {
    if (n.status !== 'sent' || n.totalRecipients === 0) return '—';
    return `${Math.round((n.readCount / n.totalRecipients) * 100)}%`;
  };

  // ── loading / empty states ──────────────────────

  if (loading && notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading notifications…</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No notifications found</p>
        <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  // ── table ───────────────────────────────────────

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {[
              { key: 'title', label: 'Title', width: 'w-[30%]' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'targetAudience', label: 'Audience' },
              { key: 'priority', label: 'Priority' },
              { key: 'createdAt', label: 'Date' },
              { key: 'readRate', label: 'Read' },
            ].map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-blue-600 ${col.width || ''}`}
                onClick={() => onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon field={col.key} />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-gray-600 w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => {
            const typeStyle = getTypeStyle(n.type);
            const statusStyle = getStatusStyle(n.status);

            return (
              <tr
                key={n.id}
                className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
              >
                {/* Title + sender */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onView(n.id)}
                    className="text-left group"
                  >
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      {getChannelIcon(n.channel)}
                      {n.senderName}
                    </p>
                  </button>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.cls}`}
                  >
                    {typeStyle.icon}
                    {typeStyle.label}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.cls}`}
                  >
                    {statusStyle.icon}
                    {statusStyle.label}
                  </span>
                </td>

                {/* Audience */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                    <Users className="h-3 w-3 text-gray-400" />
                    {getAudienceLabel(n.targetAudience)}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 capitalize">
                    <span className={`h-2 w-2 rounded-full ${getPriorityDot(n.priority)}`} />
                    {n.priority}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {formatDate(n.sentAt || n.scheduledFor || n.createdAt)}
                </td>

                {/* Read rate */}
                <td className="px-4 py-3 text-xs font-medium text-gray-700">
                  {readRate(n)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(n.id)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(n.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {loading && notifications.length > 0 && (
        <div className="flex justify-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
}
