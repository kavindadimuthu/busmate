'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/router';
import type { StopResponse } from '@busmate/api-client-core';
import {
  ConfirmDialog,
  ResourceStats,
  ResourceFilters,
  ResourceTable,
  useResource,
} from '@busmate/ui';

import { BusStopsMapView } from '@/components/mot/stops/BusStopsMapView';
import { ViewTabs } from '@/components/mot/stops/ViewTabs';
import { BusStopActionButtons } from '@/components/mot/stops/BusStopActionButtons';
import { useSetPageActions, useSetPageMetadata } from '@/context/PageContext';
import { stopsResource } from '@/resources/mot/stops.resource';

/**
 * L2 composition: uses the resource controller + Stats/Filters/Table blocks, but
 * hand-composes the table/map view toggle — an example of dropping one rung down
 * the granularity ladder for a screen the config-driven L3 view can't express.
 */
export default function BusStopsPage() {
  const router = useRouter();
  const controller = useResource(stopsResource);
  const [currentView, setCurrentView] = useState<'table' | 'map'>('table');

  useSetPageMetadata({
    title: 'Bus Stops',
    description: 'Manage and monitor bus stops across your network',
    activeItem: 'stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops' }],
  });

  useSetPageActions(
    <BusStopActionButtons
      onAddBusStop={() => router.push('/mot/stops/create')}
      onImportBusStops={() => router.push('/mot/stops/import')}
      isLoading={controller.isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <ResourceStats resource={stopsResource} controller={controller} className="lg:grid-cols-5" />
      <ResourceFilters resource={stopsResource} controller={controller} />
      <ViewTabs activeView={currentView} onViewChange={setCurrentView} />

      {currentView === 'table' ? (
        <ResourceTable
          resource={stopsResource}
          controller={controller}
          rowActions={(stop) => stopsResource.rowActions!({ row: stop, controller, navigate: router.push })}
        />
      ) : (
        <BusStopsMapView
          busStops={controller.rows}
          loading={controller.isLoading}
          onDelete={(stop: StopResponse) => controller.deleteDialog.open(stop)}
        />
      )}

      <ConfirmDialog
        open={controller.deleteDialog.isOpen}
        onOpenChange={controller.deleteDialog.setOpen}
        title="Delete Bus Stop"
        description={`Are you sure you want to delete "${controller.deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={controller.handleDeleteConfirm}
        loading={controller.isDeleting}
      />
    </div>
  );
}
