'use client';

import React from 'react';
import { Navigation } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import type { RouteResponse } from '@busmate/api-client-route';

interface RouteSelectorProps {
  routes: RouteResponse[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

/**
 * Route selector implemented as tabs.
 *
 * Each tab represents a route (Outbound/Inbound), and clicking a tab
 * switches the displayed route details.
 */
export function RouteSelector({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteSelectorProps) {
  if (routes.length === 0) return null;

  return (
    <Tabs value={selectedRouteId || ''} onValueChange={(routeId) => onSelectRoute(routeId)}>
      <TabsList>
        {routes.map((route) => (
          <TabsTrigger key={route.id} value={route.id || ''}>
            <Navigation className="h-4 w-4" />
            {route.direction === 'OUTBOUND' ? 'Outbound' : 'Inbound'}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
