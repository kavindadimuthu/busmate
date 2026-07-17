'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { ScheduleActionButtons } from '@/components/mot/schedules/ScheduleActionButtons';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { schedulesResource } from '@/resources/mot/schedules.resource';

export default function SchedulesPage() {
  const router = useRouter();
  const controller = useResource(schedulesResource);

  useSetPageMetadata({
    title: 'Schedules',
    description: 'Manage route schedules with advanced filtering and search capabilities',
    activeItem: 'schedules',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Schedules' }],
  });

  useSetPageActions(
    <ScheduleActionButtons
      onAddSchedule={() => router.push('/mot/schedules/workspace')}
      onImportSchedules={() => router.push('/mot/schedules/import')}
      onExportAll={() => controller.handleExportAll?.()}
      isLoading={controller.isLoading}
    />,
  );

  return (
    <ResourceListView
      resource={schedulesResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-6"
    />
  );
}
