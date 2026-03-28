'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  NotificationStatsCards,
  NotificationTrendChart,
} from '@/components/admin/notifications';
import { NotificationQuickPanels } from '@/components/admin/notifications/NotificationQuickPanels';
import { NotificationBreakdownPanels } from '@/components/admin/notifications/NotificationBreakdownPanels';
import { useNotificationsOverview } from '@/hooks/admin/notifications/useNotificationsOverview';
import { Plus } from 'lucide-react';

export default function NotificationsOverviewPage() {
  useSetPageMetadata({
    title: 'Notifications',
    description: 'Overview of notification activity and delivery metrics',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Notifications' }],
  });

  const {
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
  } = useNotificationsOverview();

  useSetPageActions(
    <>
      <button
        onClick={navigateToAll}
        className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted font-medium transition-colors"
      >
        View All Notifications
      </button>
      <button
        onClick={navigateToCompose}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-primary rounded-lg hover:bg-primary font-semibold shadow-sm transition-colors"
      >
        <Plus className="h-4 w-4" />
        Compose
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <NotificationStatsCards stats={stats} loading={false} />
      <NotificationTrendChart stats={stats} loading={false} />
      <NotificationQuickPanels
        recentCritical={recentCritical}
        upcoming={upcoming}
        drafts={drafts}
        onViewSent={navigateToSent}
        onViewScheduled={navigateToScheduled}
        onViewDrafts={navigateToDrafts}
        onViewNotification={navigateToNotification}
      />
      <NotificationBreakdownPanels stats={stats} />
    </div>
  );
}

