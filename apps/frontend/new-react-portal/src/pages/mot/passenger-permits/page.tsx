'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';

import { PermitActionButtons } from '@/components/mot/passenger-permits/PermitActionButtons';
import { permitsResource } from '@/resources/mot/permits.resource';

export default function PassengerServicePermitsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const controller = useResource(permitsResource);

  useSetPageMetadata({
    title: 'Passenger Service Permits Management',
    description: 'Manage and monitor passenger service permits for all operators',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits' }],
  });

  useSetPageActions(
    <PermitActionButtons
      onAddPermit={() => router.push('/mot/passenger-permits/create')}
      onImportPermits={() => toast({ title: 'Import functionality will be implemented' })}
      onExportAll={() => controller.handleExportAll?.()}
      isLoading={controller.isLoading}
    />,
  );

  return (
    <ResourceListView
      resource={permitsResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-6"
    />
  );
}
