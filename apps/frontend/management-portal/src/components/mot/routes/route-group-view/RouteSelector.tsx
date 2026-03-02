'use client';

import React, { useMemo } from 'react';
import { Navigation } from 'lucide-react';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import type { TabItem } from '@/components/shared/SwitchableTabs';
import type { RouteResponse } from '../../../../../generated/api-clients/route-management';

interface RouteSelectorProps {
  routes: RouteResponse[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

/**
 * Route selector implemented as switchable tabs.
 *
 * Each tab represents a route (Outbound/Inbound), and clicking a tab
 * switches the displayed route details.
 */
export function RouteSelector({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteSelectorProps) {
  const tabs: TabItem[] = useMemo(() => {
    return routes.map((route) => ({
      id: route.id || '',
      label: route.direction === 'OUTBOUND' ? 'Outbound' : 'Inbound',
      icon: Navigation,
    }));
  }, [routes]);

  if (routes.length === 0) return null;

  return (
    <SwitchableTabs
      tabs={tabs}
      activeTab={selectedRouteId || ''}
      onTabChange={(routeId) => onSelectRoute(routeId)}
      ariaLabel="Route selector"
    />
  );
}
