'use client';

import * as React from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Wrench,
  XCircle,
  Users,
  Mail,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';

// ── Style maps ────────────────────────────────────────────────────

const typeStyles: Record<
  string,
  { bg: string; text: string; border: string; label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  info: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Info', Icon: Info },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', label: 'Warning', Icon: AlertTriangle },
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: 'Critical', Icon: XCircle },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', label: 'Success', Icon: CheckCircle },
  maintenance: { bg: 'bg-[hsl(var(--purple-50))]', text: 'text-[hsl(var(--purple-700))]', border: 'border-[hsl(var(--purple-200))]', label: 'Maintenance', Icon: Wrench },
  error: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: 'Error', Icon: XCircle },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  medium: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  high: { bg: 'bg-warning/10', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
};

const statusMeta: Record<string, { bg: string; text: string; border: string; label: string }> = {
  sent: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', label: 'Sent' },
  scheduled: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Scheduled' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', label: 'Draft' },
  failed: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: 'Failed' },
};

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  push: Smartphone,
  email: Mail,
  sms: MessageSquare,
  'in-app': Bell,
};

const audienceLabels: Record<string, string> = {
  all: 'Everyone',
  passengers: 'Passengers',
  conductors: 'Conductors',
  fleet_operators: 'Fleet Operators',
  mot_officers: 'MOT Officers',
  timekeepers: 'Timekeepers',
};

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Shared columns ────────────────────────────────────────────────

const titleColumn: ColumnDef<any> = {
  id: 'title',
  header: 'Notification',
  sortable: true,
  cell: ({ row }) => {
    const typeSt = typeStyles[row.type] ?? typeStyles.info;
    return (
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 w-8 h-8 rounded-lg ${typeSt.bg} flex items-center justify-center ring-1 ring-black/5`}
        >
          <typeSt.Icon className={`w-4 h-4 ${typeSt.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{row.title}</p>
          <p className="text-[11px] text-muted-foreground/70 truncate leading-tight mt-0.5">{row.body}</p>
        </div>
      </div>
    );
  },
};

const typeColumn: ColumnDef<any> = {
  id: 'type',
  header: 'Type',
  cell: ({ row }) => {
    const st = typeStyles[row.type] ?? typeStyles.info;
    const { Icon } = st;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${st.bg} ${st.text} ${st.border}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {st.label}
      </span>
    );
  },
};

const priorityColumn: ColumnDef<any> = {
  id: 'priority',
  header: 'Priority',
  cell: ({ row }) => {
    const st = priorityStyles[row.priority] ?? priorityStyles.low;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border whitespace-nowrap ${st.bg} ${st.text} ${st.border}`}
      >
        {row.priority}
      </span>
    );
  },
};

// ── Received mode columns ─────────────────────────────────────────

export const receivedNotificationColumns: ColumnDef<any>[] = [
  titleColumn,
  typeColumn,
  priorityColumn,
  {
    id: 'senderName',
    header: 'Sender',
    cell: ({ row }) => (
      <span className="text-sm text-foreground/80 whitespace-nowrap">{row.senderName || '—'}</span>
    ),
  },
  {
    id: 'channel',
    header: 'Channel',
    cell: ({ row }) => {
      if (!row.channel) return <span className="text-[11px] text-muted-foreground/50 italic">—</span>;
      const ChannelIcon = channelIcons[row.channel] ?? Bell;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border capitalize whitespace-nowrap">
          <ChannelIcon className="h-3.5 w-3.5" />
          {row.channel}
        </span>
      );
    },
  },
  {
    id: 'createdAt',
    header: 'Received',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {formatDate(row.sentAt ?? row.createdAt)}
      </span>
    ),
  },
];

// ── Sent mode columns ─────────────────────────────────────────────

export const sentNotificationColumns: ColumnDef<any>[] = [
  titleColumn,
  typeColumn,
  priorityColumn,
  {
    id: 'targetAudience',
    header: 'Audience',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">
        <Users className="h-3.5 w-3.5" />
        {audienceLabels[row.targetAudience] ?? row.targetAudience}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: ({ row }) => {
      const st = statusMeta[row.status] ?? statusMeta.draft;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${st.bg} ${st.text} ${st.border}`}
        >
          {st.label}
        </span>
      );
    },
  },
  {
    id: 'sentAt',
    header: 'Sent',
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {formatDate(row.sentAt)}
      </span>
    ),
  },
  {
    id: 'readCount',
    header: 'Read Rate',
    cell: ({ row }) => {
      const rate =
        !row.totalRecipients || row.totalRecipients === 0
          ? '—'
          : `${Math.round((row.readCount / row.totalRecipients) * 100)}%`;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{rate}</span>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {row.readCount?.toLocaleString()} / {row.totalRecipients?.toLocaleString()}
          </span>
        </div>
      );
    },
  },
];
