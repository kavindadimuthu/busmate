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
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Info', Icon: Info },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Warning', Icon: AlertTriangle },
  critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Critical', Icon: XCircle },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Success', Icon: CheckCircle },
  maintenance: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Maintenance', Icon: Wrench },
  error: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Error', Icon: XCircle },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

const statusMeta: Record<string, { bg: string; text: string; border: string; label: string }> = {
  sent: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Sent' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Scheduled' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Draft' },
  failed: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Failed' },
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
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{row.title}</p>
          <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{row.body}</p>
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
      <span className="text-sm text-gray-700 whitespace-nowrap">{row.senderName || '—'}</span>
    ),
  },
  {
    id: 'channel',
    header: 'Channel',
    cell: ({ row }) => {
      if (!row.channel) return <span className="text-[11px] text-gray-300 italic">—</span>;
      const ChannelIcon = channelIcons[row.channel] ?? Bell;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 capitalize whitespace-nowrap">
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
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 whitespace-nowrap">
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
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
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
          <span className="text-sm font-semibold text-gray-900">{rate}</span>
          <span className="text-[11px] text-gray-400 tabular-nums">
            {row.readCount?.toLocaleString()} / {row.totalRecipients?.toLocaleString()}
          </span>
        </div>
      );
    },
  },
];
