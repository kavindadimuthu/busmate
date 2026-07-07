'use client';

import * as React from 'react';
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
  Users,
  Mail,
  Smartphone,
} from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';
import type { Notification } from '@/data/admin/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeStyle(type: string) {
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
      cls: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      icon: <Wrench className="h-3 w-3" />,
      label: 'Maintenance',
    },
    error: {
      cls: 'bg-destructive/10 text-destructive border border-destructive/20',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Error',
    },
  };
  return map[type] ?? map.info;
}

function getStatusStyle(status: string) {
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
  return map[status] ?? map.draft;
}

function getPriorityDot(priority: string) {
  const colors: Record<string, string> = {
    critical: 'bg-destructive',
    high: 'bg-warning',
    medium: 'bg-warning',
    low: 'bg-secondary',
  };
  return colors[priority] ?? colors.low;
}

function getAudienceLabel(audience: string) {
  return audience.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getChannelIcon(channel?: string) {
  switch (channel) {
    case 'email':
      return <Mail className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'sms':
      return <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function formatDate(dateStr?: string) {
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
}

// ─── Columns ─────────────────────────────────────────────────────────────────

export const notificationColumns: ColumnDef<Notification>[] = [
  {
    id: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {row.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          {getChannelIcon(row.channel)}
          {row.senderName}
        </p>
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    sortable: true,
    cell: ({ row }) => {
      const style = getTypeStyle(row.type);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.cls}`}>
          {style.icon}
          {style.label}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: ({ row }) => {
      const style = getStatusStyle(row.status);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.cls}`}>
          {style.icon}
          {style.label}
        </span>
      );
    },
  },
  {
    id: 'targetAudience',
    header: 'Audience',
    hideBelow: 'lg',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 text-xs text-foreground/80">
        <Users className="h-3 w-3 text-muted-foreground/70" />
        {getAudienceLabel(row.targetAudience)}
      </span>
    ),
  },
  {
    id: 'priority',
    header: 'Priority',
    sortable: true,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 text-xs text-foreground/80 capitalize">
        <span className={`h-2 w-2 rounded-full ${getPriorityDot(row.priority)}`} />
        {row.priority}
      </span>
    ),
  },
  {
    id: 'createdAt',
    header: 'Date',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(row.sentAt ?? row.scheduledFor ?? row.createdAt)}
      </span>
    ),
  },
  {
    id: 'readRate',
    header: 'Read',
    align: 'center',
    cell: ({ row }) => {
      const rate =
        row.status === 'sent' && row.totalRecipients > 0
          ? `${Math.round((row.readCount / row.totalRecipients) * 100)}%`
          : '—';
      return <span className="text-xs font-medium text-foreground/80">{rate}</span>;
    },
  },
];
