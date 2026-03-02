'use client';

import React, { useMemo } from 'react';
import {
    Eye,
    Trash2,
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
import type { Notification } from '@/data/admin/types';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

export type NotificationsTableMode = 'received' | 'sent';

interface NotificationsTableProps {
    notifications: Notification[];
    mode: NotificationsTableMode;
    loading?: boolean;
    onView: (id: string) => void;
    onDelete: (notification: Notification) => void;
    currentSort: SortState;
    onSort: (field: string, direction: 'asc' | 'desc') => void;
}

// ── Style helpers ─────────────────────────────────────────────────

const typeStyles: Record<string, { bg: string; text: string; border: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    info:        { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Info',        Icon: Info },
    warning:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Warning',     Icon: AlertTriangle },
    critical:    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     label: 'Critical',    Icon: XCircle },
    success:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Success',     Icon: CheckCircle },
    maintenance: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  label: 'Maintenance', Icon: Wrench },
    error:       { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     label: 'Error',       Icon: XCircle },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    low:      { bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200' },
    medium:   { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
    high:     { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
    critical: { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },
};

const statusMeta: Record<string, { bg: string; text: string; border: string; label: string }> = {
    sent:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Sent' },
    scheduled: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Scheduled' },
    draft:     { bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200',    label: 'Draft' },
    failed:    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     label: 'Failed' },
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

// ── Helpers ───────────────────────────────────────────────────────

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

function readRatePercent(n: Notification): string {
    if (!n.totalRecipients || n.totalRecipients === 0) return '—';
    return `${Math.round((n.readCount / n.totalRecipients) * 100)}%`;
}

// ── Main component ────────────────────────────────────────────────

/**
 * Notifications data table.
 *
 * Renders different column sets for "received" vs "sent" mode.
 * Delegates rendering to the shared `<DataTable>` component.
 */
export function NotificationsTable({
    notifications,
    mode,
    loading,
    onView,
    onDelete,
    currentSort,
    onSort,
}: NotificationsTableProps) {
    const columns = useMemo<DataTableColumn<Notification>[]>(() => {
        const titleCol: DataTableColumn<Notification> = {
            key: 'title',
            header: 'Notification',
            sortable: true,
            minWidth: 'min-w-[220px]',
            render: (n) => {
                const typeSt = typeStyles[n.type] ?? typeStyles.info;
                return (
                    <button
                        className="text-left w-full flex items-center gap-3 group"
                        onClick={() => onView(n.id)}
                    >
                        <div className={`shrink-0 w-8 h-8 rounded-lg ${typeSt.bg} flex items-center justify-center ring-1 ring-black/5`}>
                            <typeSt.Icon className={`w-4 h-4 ${typeSt.text}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
                                {n.title}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{n.body}</p>
                        </div>
                    </button>
                );
            },
        };

        const typeCol: DataTableColumn<Notification> = {
            key: 'type',
            header: 'Type',
            cellClassName: 'whitespace-nowrap',
            render: (n) => {
                const st = typeStyles[n.type] ?? typeStyles.info;
                const { Icon } = st;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text} ${st.border}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {st.label}
                    </span>
                );
            },
        };

        const priorityCol: DataTableColumn<Notification> = {
            key: 'priority',
            header: 'Priority',
            cellClassName: 'whitespace-nowrap',
            render: (n) => {
                const st = priorityStyles[n.priority] ?? priorityStyles.low;
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${st.bg} ${st.text} ${st.border}`}>
                        {n.priority}
                    </span>
                );
            },
        };

        const actionsCol: DataTableColumn<Notification> = {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'text-center',
            cellClassName: 'text-center whitespace-nowrap',
            render: (n) => (
                <div className="inline-flex items-center gap-1">
                    <button
                        onClick={() => onView(n.id)}
                        title="View details"
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(n)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ),
        };

        if (mode === 'received') {
            return [
                titleCol,
                typeCol,
                priorityCol,
                {
                    key: 'senderName',
                    header: 'Sender',
                    cellClassName: 'whitespace-nowrap',
                    render: (n) => (
                        <span className="text-sm text-gray-700">{n.senderName || '—'}</span>
                    ),
                },
                {
                    key: 'channel',
                    header: 'Channel',
                    cellClassName: 'whitespace-nowrap',
                    render: (n) => {
                        if (!n.channel) return <span className="text-[11px] text-gray-300 italic">—</span>;
                        const ChannelIcon = channelIcons[n.channel] ?? Bell;
                        return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 capitalize">
                                <ChannelIcon className="h-3.5 w-3.5" />
                                {n.channel}
                            </span>
                        );
                    },
                },
                {
                    key: 'createdAt',
                    header: 'Received',
                    sortable: true,
                    cellClassName: 'whitespace-nowrap',
                    render: (n) => (
                        <span className="text-xs text-gray-500 tabular-nums">
                            {formatDate(n.sentAt ?? n.createdAt)}
                        </span>
                    ),
                },
                actionsCol,
            ];
        }

        // Sent mode
        return [
            titleCol,
            typeCol,
            priorityCol,
            {
                key: 'targetAudience',
                header: 'Audience',
                cellClassName: 'whitespace-nowrap',
                render: (n) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        <Users className="h-3.5 w-3.5" />
                        {audienceLabels[n.targetAudience] ?? n.targetAudience}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                sortable: true,
                cellClassName: 'whitespace-nowrap',
                render: (n) => {
                    const st = statusMeta[n.status] ?? statusMeta.draft;
                    return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text} ${st.border}`}>
                            {st.label}
                        </span>
                    );
                },
            },
            {
                key: 'sentAt',
                header: 'Sent',
                sortable: true,
                cellClassName: 'whitespace-nowrap',
                render: (n) => (
                    <span className="text-xs text-gray-500 tabular-nums">
                        {formatDate(n.sentAt)}
                    </span>
                ),
            },
            {
                key: 'readCount',
                header: 'Read Rate',
                cellClassName: 'whitespace-nowrap',
                render: (n) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">{readRatePercent(n)}</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">{n.readCount.toLocaleString()} / {n.totalRecipients.toLocaleString()}</span>
                    </div>
                ),
            },
            actionsCol,
        ];
    }, [mode, onView, onDelete]);

    return (
        <DataTable<Notification>
            columns={columns}
            data={notifications}
            loading={loading}
            currentSort={currentSort}
            onSort={onSort}
            rowKey={(n) => n.id}
            showRefreshing
            emptyState={
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                        <Bell className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No notifications found</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                    </p>
                </div>
            }
        />
    );
}
