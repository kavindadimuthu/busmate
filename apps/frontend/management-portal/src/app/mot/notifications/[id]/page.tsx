'use client';

import { useMemo, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    AlertTriangle,
    Bell,
    Send,
    Inbox,
    Clock,
    Users,
    Smartphone,
    Mail,
    MessageSquare,
    CheckCircle,
    CheckCircle2,
    Trash2,
    Tag,
    Info,
    Wrench,
    XCircle,
    BarChart2,
    CalendarClock,
} from 'lucide-react';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationModal } from '@/components/mot/confirmation-modals';
import { getNotificationById, deleteNotification } from '@/data/admin';
import type { Notification } from '@/data/admin/types';

// ── Style maps ────────────────────────────────────────────────────

const typeStyles: Record<string, { cls: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    info: { cls: 'bg-primary/10 text-primary border border-primary/20', label: 'Info', Icon: Info },
    warning: { cls: 'bg-warning/10 text-warning border border-warning/20', label: 'Warning', Icon: AlertTriangle },
    critical: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Critical', Icon: XCircle },
    success: { cls: 'bg-success/10 text-success border border-success/20', label: 'Success', Icon: CheckCircle },
    maintenance: { cls: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border border-[hsl(var(--purple-200))]', label: 'Maintenance', Icon: Wrench },
    error: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Error', Icon: XCircle },
};

const priorityStyles: Record<string, string> = {
    low: 'bg-muted text-muted-foreground border border-border',
    medium: 'bg-primary/10 text-primary border border-primary/20',
    high: 'bg-warning/10 text-orange-700 border border-orange-200',
    critical: 'bg-destructive/10 text-destructive border border-destructive/20',
};

const statusStyles: Record<string, { cls: string; label: string }> = {
    sent: { cls: 'bg-success/10 text-success border border-success/20', label: 'Sent' },
    scheduled: { cls: 'bg-primary/10 text-primary border border-primary/20', label: 'Scheduled' },
    draft: { cls: 'bg-muted text-muted-foreground border border-border', label: 'Draft' },
    failed: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Failed' },
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
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function readRatePercent(n: Notification): number {
    if (!n.totalRecipients || n.totalRecipients === 0) return 0;
    return Math.round((n.readCount / n.totalRecipients) * 100);
}

// ── Detail row helper ─────────────────────────────────────────────

function DetailRow({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2 w-40 shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

// ── Page component ────────────────────────────────────────────────

export default function NotificationDetailContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const notificationId = params.id as string;
    const fromTab = searchParams.get('from') ?? 'received';
    const isReceived = fromTab === 'received';

    const notification = useMemo(() => getNotificationById(notificationId), [notificationId]);

    // Local read state (for received notifications)
    const [isRead, setIsRead] = useState(false);

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Metadata ───────────────────────────────────────────────

    useSetPageMetadata({
        title: notification?.title ?? 'Notification Details',
        description: isReceived ? 'Received notification details' : 'Sent notification details',
        activeItem: 'notifications',
        showBreadcrumbs: true,
        breadcrumbs: [
            { label: 'Notifications', href: '/mot/notifications' },
            { label: notification?.title ?? 'Details' },
        ],
    });

    const handleDeleteClick = useCallback(() => setShowDeleteModal(true), []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!notification) return;
        try {
            setIsDeleting(true);
            await deleteNotification(notification.id);
            toast({
                title: 'Notification Deleted',
                description: `"${notification.title}" has been deleted.`,
            });
            router.push('/mot/notifications');
        } catch {
            toast({
                title: 'Delete Failed',
                description: 'Failed to delete notification. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    }, [notification, router, toast]);

    useSetPageActions(
        notification ? (
            <div className="flex items-center gap-2">
                {isReceived && (
                    <button
                        onClick={() => setIsRead((prev) => !prev)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            isRead
                                ? 'bg-success/10 text-success border-success/20 hover:bg-success/15'
                                : 'bg-card text-foreground/80 border-border hover:bg-muted'
                        }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {isRead ? 'Marked as Read' : 'Mark as Read'}
                    </button>
                )}
                <button
                    onClick={handleDeleteClick}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive bg-card border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>
            </div>
        ) : null
    );

    // ── Not found ──────────────────────────────────────────────

    if (!notification) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="p-4 bg-warning/10 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-warning/80" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Notification Not Found</h2>
                <p className="text-sm text-muted-foreground">
                    The notification with ID &ldquo;{notificationId}&rdquo; could not be found.
                </p>
                <button
                    onClick={() => router.push('/mot/notifications')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Notifications
                </button>
            </div>
        );
    }

    const typeStyle = typeStyles[notification.type] ?? typeStyles.info;
    const { Icon: TypeIcon } = typeStyle;
    const statusStyle = statusStyles[notification.status] ?? statusStyles.draft;
    const ChannelIcon = notification.channel ? (channelIcons[notification.channel] ?? Bell) : Bell;
    const rate = readRatePercent(notification);

    return (
        <div className="space-y-6">
            {/* Main card */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Header banner */}
                <div className={`px-6 py-5 border-b border-border/50 flex items-start gap-4 ${isRead ? 'bg-success/10/30' : 'bg-card'}`}>
                    <div className={`p-3 rounded-xl border ${typeStyle.cls}`}>
                        <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h1 className="text-xl font-bold text-foreground">{notification.title}</h1>
                            {isRead && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Read
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.cls}`}>
                                <TypeIcon className="h-3 w-3" />
                                {typeStyle.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityStyles[notification.priority] ?? 'bg-muted text-muted-foreground'}`}>
                                {notification.priority} priority
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.cls}`}>
                                {statusStyle.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 border-b border-border/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-2">Message</h3>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{notification.body}</p>
                </div>

                {/* Metadata */}
                <div className="px-6 py-2">
                    <DetailRow icon={isReceived ? Inbox : Send} label={isReceived ? 'From' : 'Sent by'}>
                        <span className="text-sm text-foreground font-medium">{notification.senderName}</span>
                        <span className="text-xs text-muted-foreground/70 ml-2">({notification.senderId})</span>
                    </DetailRow>

                    <DetailRow icon={Users} label="Audience">
                        <span className="text-sm text-foreground/80">{audienceLabels[notification.targetAudience] ?? notification.targetAudience}</span>
                    </DetailRow>

                    {notification.channel && (
                        <DetailRow icon={ChannelIcon} label="Channel">
                            <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80 capitalize">
                                <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
                                {notification.channel}
                            </span>
                        </DetailRow>
                    )}

                    <DetailRow icon={Clock} label="Created">
                        <span className="text-sm text-foreground/80">{formatDate(notification.createdAt)}</span>
                    </DetailRow>

                    {notification.sentAt && (
                        <DetailRow icon={Send} label="Sent at">
                            <span className="text-sm text-foreground/80">{formatDate(notification.sentAt)}</span>
                        </DetailRow>
                    )}

                    {notification.scheduledFor && (
                        <DetailRow icon={CalendarClock} label="Scheduled for">
                            <span className="text-sm text-foreground/80">{formatDate(notification.scheduledFor)}</span>
                        </DetailRow>
                    )}

                    <DetailRow icon={Tag} label="ID">
                        <span className="text-sm font-mono text-muted-foreground">{notification.id}</span>
                    </DetailRow>
                </div>

                {/* Read rate — only for sent */}
                {!isReceived && notification.status === 'sent' && (
                    <div className="px-6 py-5 border-t border-border/50 bg-muted/50">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-4">
                            Delivery &amp; Engagement
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-card rounded-lg border border-border p-4 text-center">
                                <p className="text-2xl font-bold text-foreground">{notification.totalRecipients.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Total Recipients</p>
                            </div>
                            <div className="bg-card rounded-lg border border-border p-4 text-center">
                                <p className="text-2xl font-bold text-success">{notification.readCount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Reads</p>
                            </div>
                            <div className="bg-card rounded-lg border border-border p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <p className="text-2xl font-bold text-primary">{rate}%</p>
                                    <BarChart2 className="h-5 w-5 text-primary/70" />
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/80 rounded-full transition-all"
                                        style={{ width: `${rate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">Read Rate</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Notification"
                itemName={notification.title}
                isLoading={isDeleting}
            />
        </div>
    );
}
