'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { NotificationDetailPanel } from '@/components/admin/notifications';
import { getNotificationById } from '@/data/admin';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;

  const notification = useMemo(() => getNotificationById(notificationId), [notificationId]);

  useSetPageMetadata({
    title: notification ? notification.title : 'Notification Details',
    description: 'View notification content and delivery metrics',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Explorer', href: '/admin/notifications/listing' },
      { label: notification?.id || 'Detail' },
    ],
  });

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 bg-warning/10 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Notification Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The notification with ID &ldquo;{notificationId}&rdquo; could not be found.
        </p>
        <button
          onClick={() => router.push('/admin/notifications')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary border border-primary/20 rounded-lg hover:bg-primary/10 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <NotificationDetailPanel notification={notification} />
    </div>
  );
}
