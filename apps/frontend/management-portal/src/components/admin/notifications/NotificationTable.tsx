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
      return <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    return currentSort.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const getTypeStyle = (type: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      info: {
        cls: 'bg-primary/10 text-primary border border-primary/20',
        icon: <Info className="h-3 w-3" />,
        label: 'Info',
      },
      warning: {
        cls: 'bg-warning/10 text-warning border border-warning/20',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Warning',
      },
      critical: {
        cls: 'bg-destructive/10 text-destructive border border-destructive/20',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Critical',
      },
      success: {
        cls: 'bg-success/10 text-success border border-success/20',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Success',
      },
      maintenance: {
        cls: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border border-[hsl(var(--purple-200))]',
        icon: <Wrench className="h-3 w-3" />,
        label: 'Maintenance',
      },
      error: {
        cls: 'bg-destructive/10 text-destructive border border-destructive/20',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Error',
      },
    };
    return map[type] || map.info;
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      sent: {
        cls: 'bg-success/10 text-success border border-success/20',
        icon: <Send className="h-3 w-3" />,
        label: 'Sent',
      },
      scheduled: {
        cls: 'bg-warning/10 text-warning border border-warning/20',
        icon: <Clock className="h-3 w-3" />,
        label: 'Scheduled',
      },
      draft: {
        cls: 'bg-muted text-muted-foreground border border-border',
        icon: <FileEdit className="h-3 w-3" />,
        label: 'Draft',
      },
      failed: {
        cls: 'bg-destructive/10 text-destructive border border-destructive/20',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Failed',
      },
    };
    return map[status] || map.draft;
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive',
      high: 'bg-warning',
      medium: 'bg-warning',
      low: 'bg-secondary',
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
        return <Mail className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'sms':
        return <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
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
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Loading notifications…</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground/80">No notifications found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  // ── table ───────────────────────────────────────

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted border-b border-border">
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
                className={`px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary ${col.width || ''}`}
                onClick={() => onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon field={col.key} />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-24">
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
                className="border-b border-border/50 hover:bg-muted/60 transition-colors"
              >
                {/* Title + sender */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onView(n.id)}
                    className="text-left group"
                  >
                    <p className="font-medium text-foreground group-hover:text-primary line-clamp-1 transition-colors">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
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
                  <span className="inline-flex items-center gap-1 text-xs text-foreground/80">
                    <Users className="h-3 w-3 text-muted-foreground/70" />
                    {getAudienceLabel(n.targetAudience)}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-foreground/80 capitalize">
                    <span className={`h-2 w-2 rounded-full ${getPriorityDot(n.priority)}`} />
                    {n.priority}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(n.sentAt || n.scheduledFor || n.createdAt)}
                </td>

                {/* Read rate */}
                <td className="px-4 py-3 text-xs font-medium text-foreground/80">
                  {readRate(n)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(n.id)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(n.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
