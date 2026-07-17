'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

import { BusActionButtons } from '@/components/mot/buses/BusActionButtons';
import { busesResource } from '@/resources/mot/buses.resource';

export default function BusesPage() {
  const router = useRouter();
  const controller = useResource(busesResource);

  useSetPageMetadata({
    title: 'Buses Management',
    description: 'Manage and monitor bus fleet across all operators',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses' }],
  });

  useSetPageActions(
    <BusActionButtons
      onAddBus={() => router.push('/mot/buses/create')}
      onImportBuses={() => router.push('/mot/buses/import')}
      onExportAll={() => controller.handleExportAll?.()}
      isLoading={controller.isLoading}
    />,
  );

  return <ResourceListView resource={busesResource} controller={controller} navigate={router.push} />;
}
