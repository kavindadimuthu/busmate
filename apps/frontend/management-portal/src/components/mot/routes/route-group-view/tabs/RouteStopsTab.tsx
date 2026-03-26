'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Eye, ChevronRight, Navigation, ExternalLink } from 'lucide-react';
import type { RouteResponse } from '@busmate/api-client-route';

// ── Types ─────────────────────────────────────────────────────────

interface RouteStopsTabProps {
  route: RouteResponse;
}

interface DisplayStop {
  stopId?: string;
  stopName?: string;
  type: 'start' | 'intermediate' | 'end';
  distance: number;
  order: number;
}

// ── Helper functions ──────────────────────────────────────────────

function getOrderedStops(route: RouteResponse): DisplayStop[] {
  const stops: DisplayStop[] = [];

  // Start stop
  stops.push({
    stopId: route.startStopId,
    stopName: route.startStopName,
    type: 'start',
    distance: 0,
    order: 0,
  });

  // Intermediate stops (sorted by order)
  if (route.routeStops && route.routeStops.length > 0) {
    const sortedStops = [...route.routeStops]
      .filter(
        (s) => s.stopName !== route.startStopName && s.stopName !== route.endStopName
      )
      .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));

    sortedStops.forEach((stop, idx) => {
      stops.push({
        stopId: stop.stopId,
        stopName: stop.stopName,
        type: 'intermediate',
        distance: stop.distanceFromStartKm || 0,
        order: idx + 1,
      });
    });
  }

  // End stop
  stops.push({
    stopId: route.endStopId,
    stopName: route.endStopName,
    type: 'end',
    distance: route.distanceKm || 0,
    order: stops.length,
  });

  return stops;
}

// ── Component ─────────────────────────────────────────────────────

export function RouteStopsTab({ route }: RouteStopsTabProps) {
  const router = useRouter();
  const stops = getOrderedStops(route);
  const isOutbound = route.direction === 'OUTBOUND';

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Route Stops</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stops.length} stops along {route.distanceKm?.toFixed(1) || 0} km route
          </p>
        </div>

        {/* Direction badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isOutbound
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          <Navigation
            className={`w-4 h-4 ${isOutbound ? 'rotate-45' : '-rotate-[135deg]'}`}
          />
          {route.direction}
        </div>
      </div>

      {/* Stops timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-300 to-red-400" />

        {/* Stops list */}
        <div className="space-y-0">
          {stops.map((stop, index) => {
            const isFirst = stop.type === 'start';
            const isLast = stop.type === 'end';

            // Node styling based on type
            const nodeStyles = isFirst
              ? 'bg-success text-white shadow-emerald-500/30'
              : isLast
              ? 'bg-destructive text-white shadow-red-500/30'
              : 'bg-card border-2 border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary';

            // Card styling on hover
            const cardStyles = isFirst
              ? 'border-success/20 bg-success/10/30'
              : isLast
              ? 'border-destructive/20 bg-destructive/10/30'
              : 'border-border/50 hover:border-primary/20 hover:bg-primary/10/30';

            return (
              <div key={stop.stopId || index} className="relative flex items-start gap-4 py-3 group">
                {/* Timeline node */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all ${nodeStyles}`}
                >
                  {isFirst ? (
                    <span className="text-sm font-bold">A</span>
                  ) : isLast ? (
                    <span className="text-sm font-bold">B</span>
                  ) : (
                    <span className="text-sm font-bold">{index}</span>
                  )}
                </div>

                {/* Stop card */}
                <div
                  className={`flex-1 bg-card rounded-xl border p-4 transition-all cursor-pointer ${cardStyles}`}
                  onClick={() => stop.stopId && router.push(`/mot/bus-stops/${stop.stopId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Stop name */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {stop.stopName || 'Unknown Stop'}
                        </h4>
                        {isFirst && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-success/15 text-success">
                            Origin
                          </span>
                        )}
                        {isLast && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-destructive/15 text-destructive">
                            Destination
                          </span>
                        )}
                      </div>

                      {/* Stop details */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span>{stop.distance.toFixed(1)} km from start</span>
                        </div>
                        {stop.stopId && (
                          <div className="hidden sm:block font-mono text-xs text-muted-foreground/70">
                            ID: {stop.stopId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View button */}
                    {stop.stopId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/mot/bus-stops/${stop.stopId}`);
                        }}
                        className="p-2.5 text-muted-foreground/70 hover:text-primary hover:bg-primary/15 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="View stop details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Journey summary */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stops.length}</div>
              <div className="text-xs text-muted-foreground">Total Stops</div>
            </div>
            <div className="w-px h-10 bg-secondary" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {route.distanceKm?.toFixed(1) || 0}
              </div>
              <div className="text-xs text-muted-foreground">Kilometers</div>
            </div>
            <div className="w-px h-10 bg-secondary" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stops.length > 1
                  ? (route.distanceKm! / (stops.length - 1)).toFixed(1)
                  : '0'}
              </div>
              <div className="text-xs text-muted-foreground">Avg km/stop</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/mot/bus-stops')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            View All Stops
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
