'use client';

import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNotificationDetail } from '@/components/mot/notifications/useNotificationDetail';
import {
  NotificationHeader,
  NotificationMetadata,
  NotificationEngagement,
} from '@/components/mot/notifications/NotificationDetailSections';
import { DeleteConfirmationModal } from '@/components/mot/confirmation-modals';

export default function NotificationDetailContent() {
  const {
    notification,
    notificationId,
    isReceived,
    isRead,
    showDeleteModal,
    isDeleting,
    handleBack,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useNotificationDetail();

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
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <NotificationHeader notification={notification} isRead={isRead} />

        <div className="px-6 py-5 border-b border-border/50">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-2">Message</h3>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{notification.body}</p>
        </div>

        <NotificationMetadata notification={notification} isReceived={isReceived} />

        {!isReceived && notification.status === 'sent' && (
          <NotificationEngagement notification={notification} />
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        itemName={notification.title}
        isLoading={isDeleting}
      />
    </div>
  );
}
