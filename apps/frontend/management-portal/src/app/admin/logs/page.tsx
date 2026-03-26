'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { LogStatsCards, LogTrendChart } from '@/components/admin/logs';
import { LogQuickAccessPanels } from '@/components/admin/logs/LogQuickAccessPanels';
import { LogStatsSummary } from '@/components/admin/logs/LogStatsSummary';
import { useLogsOverview } from '@/components/admin/logs/useLogsOverview';

export default function LogsOverviewPage() {
  useSetPageMetadata({
    title: 'System Logs',
    description: 'Overview of all system logging activity and trends',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs' }],
  });

  const {
    stats,
    recentSecurity,
    recentErrors,
    recentUserActivity,
    navigateToSecurity,
    navigateToApplication,
    navigateToActivity,
    navigateToLog,
  } = useLogsOverview();

  return (
    <div className="space-y-6">
      <LogStatsCards stats={stats} loading={false} />
      <LogTrendChart stats={stats} loading={false} />
      <LogQuickAccessPanels
        recentSecurity={recentSecurity}
        recentErrors={recentErrors}
        recentUserActivity={recentUserActivity}
        onViewSecurity={navigateToSecurity}
        onViewApplication={navigateToApplication}
        onViewActivity={navigateToActivity}
        onViewLog={navigateToLog}
      />
      <LogStatsSummary stats={stats} />
    </div>
  );
}
