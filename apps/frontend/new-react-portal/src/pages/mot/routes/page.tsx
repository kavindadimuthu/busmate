'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { RouteActionButtons } from '@/components/mot/routes/RouteActionButtons';
import { routesResource } from '@/resources/mot/routes.resource';

export default function RoutesPage() {
  const router = useRouter();
  const controller = useResource(routesResource);

  useSetPageMetadata({
    title: 'Routes',
    description: 'Manage bus routes with advanced filtering and search capabilities',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes' }],
  });

  useSetPageActions(
    <RouteActionButtons
      onAddRoute={() => router.push('/mot/routes/workspace')}
      onImport={() => router.push('/mot/routes/import')}
      onExportAll={() => controller.handleExportAll?.()}
      isLoading={controller.isLoading}
    />,
  );

  return (
    <ResourceListView
      resource={routesResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-6"
    />
  );
}
