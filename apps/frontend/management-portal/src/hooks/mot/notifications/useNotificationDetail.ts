import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { NotificationDetailActions } from '@/components/mot/notifications/NotificationDetailActions';
import { useToast } from '@/hooks/use-toast';
import { getNotificationById, deleteNotification } from '@/data/admin';
import type { Notification } from '@/data/admin/types';

// ── Style maps ────────────────────────────────────────────────────

export const typeStyles: Record<
  string,
  { cls: string; label: string; icon: string }
> = {
  info: { cls: 'bg-primary/10 text-primary border border-primary/20', label: 'Info', icon: 'Info' },
  warning: { cls: 'bg-warning/10 text-warning border border-warning/20', label: 'Warning', icon: 'AlertTriangle' },
  critical: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Critical', icon: 'XCircle' },
  success: { cls: 'bg-success/10 text-success border border-success/20', label: 'Success', icon: 'CheckCircle' },
  maintenance: { cls: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border border-[hsl(var(--purple-200))]', label: 'Maintenance', icon: 'Wrench' },
  error: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Error', icon: 'XCircle' },
};

export const priorityStyles: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border border-border',
  medium: 'bg-primary/10 text-primary border border-primary/20',
  high: 'bg-warning/10 text-orange-700 border border-orange-200',
  critical: 'bg-destructive/10 text-destructive border border-destructive/20',
};

export const statusStyles: Record<string, { cls: string; label: string }> = {
  sent: { cls: 'bg-success/10 text-success border border-success/20', label: 'Sent' },
  scheduled: { cls: 'bg-primary/10 text-primary border border-primary/20', label: 'Scheduled' },
  draft: { cls: 'bg-muted text-muted-foreground border border-border', label: 'Draft' },
  failed: { cls: 'bg-destructive/10 text-destructive border border-destructive/20', label: 'Failed' },
};

export const channelIconNames: Record<string, string> = {
  push: 'Smartphone',
  email: 'Mail',
  sms: 'MessageSquare',
  'in-app': 'Bell',
};

export const audienceLabels: Record<string, string> = {
  all: 'Everyone',
  passengers: 'Passengers',
  conductors: 'Conductors',
  fleet_operators: 'Fleet Operators',
  mot_officers: 'MOT Officers',
  timekeepers: 'Timekeepers',
};

// ── Helpers ───────────────────────────────────────────────────────

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function readRatePercent(n: Notification): number {
  if (!n.totalRecipients || n.totalRecipients === 0) return 0;
  return Math.round((n.readCount / n.totalRecipients) * 100);
}

// ── Hook ──────────────────────────────────────────────────────────

export function useNotificationDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const notificationId = params.id as string;
  const fromTab = searchParams.get('from') ?? 'received';
  const isReceived = fromTab === 'received';

  const notification = useMemo(() => getNotificationById(notificationId), [notificationId]);

  const [isRead, setIsRead] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const handleToggleRead = useCallback(() => setIsRead((prev) => !prev), []);
  const handleDeleteClick = useCallback(() => setShowDeleteModal(true), []);
  const handleDeleteCancel = useCallback(() => setShowDeleteModal(false), []);

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

  const handleBack = useCallback(() => {
    router.push('/mot/notifications');
  }, [router]);

  // ── Page metadata & actions ───────────────────────────────

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

  useSetPageActions(
    React.createElement(NotificationDetailActions, {
      isReceived,
      isRead,
      onToggleRead: handleToggleRead,
      onDelete: handleDeleteClick,
      hasNotification: !!notification,
    })
  );

  return {
    notification,
    notificationId,
    isReceived,
    isRead,
    showDeleteModal,
    isDeleting,
    handleBack,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
}
