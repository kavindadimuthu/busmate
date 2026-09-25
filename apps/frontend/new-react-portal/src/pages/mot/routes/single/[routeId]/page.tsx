'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { RouteManagementService } from '@busmate/api-client-core';
import type { RouteResponse } from '@busmate/api-client-core';
import { RouteTabs } from '@/components/mot/routes/route-group-view';
import { useSetPageMetadata } from '@/context/PageContext';
import { useParams, useRouter } from '@/lib/router';

/**
 * One route by its own id. A route need not belong to a group (ADR-023) — a community timetable's routes do not —
 * and the route-group page can only reach a route through its group, so those routes had no page at all.
 */
export default function SingleRoutePage() {
  const { routeId } = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: route?.name ?? 'Route',
    description: 'A route that is not part of a route group',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes', href: '/mot/routes' }, { label: route?.name ?? 'Route' }],
  });

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    RouteManagementService.getRouteById(routeId as string)
      .then((r) => { if (!cancelled) setRoute(r); })
      .catch((e) => { if (!cancelled) setError(e?.body?.message ?? 'Could not load this route.'); });
    return () => { cancelled = true; };
  }, [routeId]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    );
  }
  if (!route) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/mot/routes')} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> All routes
      </button>
      <RouteTabs route={route} />
    </div>
  );
}
