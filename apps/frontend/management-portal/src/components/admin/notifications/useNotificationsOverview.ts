'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationStats,
  getSentNotifications,
  getScheduledNotifications,
  getDraftNotifications,
} from '@/data/admin';

export function useNotificationsOverview() {
  const router = useRouter();

  const stats = useMemo(() => getNotificationStats(), []);
  const recentCritical = useMemo(
    () =>
      getSentNotifications()
        .filter((n) => n.priority === 'critical' || n.priority === 'high')
        .slice(0, 5),
    []
  );
  const upcoming = useMemo(() => getScheduledNotifications(5), []);
  const drafts = useMemo(() => getDraftNotifications(5), []);

  const navigateToAll = () => router.push('/admin/notifications/listing');
  const navigateToSent = () => router.push('/admin/notifications/listing?tab=sent');
  const navigateToScheduled = () => router.push('/admin/notifications/listing?tab=scheduled');
  const navigateToDrafts = () => router.push('/admin/notifications/listing?tab=drafts');
  const navigateToCompose = () => router.push('/admin/notifications/compose');
  const navigateToNotification = (id: string) => router.push(`/admin/notifications/${id}`);

  return {
    stats,
    recentCritical,
    upcoming,
    drafts,
    navigateToAll,
    navigateToSent,
    navigateToScheduled,
    navigateToDrafts,
    navigateToCompose,
    navigateToNotification,
  };
}
