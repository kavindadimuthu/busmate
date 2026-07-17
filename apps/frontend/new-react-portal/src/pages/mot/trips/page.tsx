'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { TripActionButtons } from '@/components/mot/trips/TripActionButtons';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { tripsResource } from '@/resources/mot/trips.resource';

export default function TripsPage() {
  const router = useRouter();
  const controller = useResource(tripsResource);

  useSetPageMetadata({
    title: 'Trips',
    description: 'Manage and monitor bus trips, assignments, and schedules',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  useSetPageActions(
    <TripActionButtons
      onAddTrip={() => router.push('/mot/trips/add')}
      onGenerateTrips={() => router.push('/mot/trips/assignment')}
      onExportAll={() => {}}
      isLoading={controller.isLoading}
    />,
  );

  return (
    <ResourceListView
      resource={tripsResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-6"
    />
  );
}
