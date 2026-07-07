'use client';

import { MapPin, Navigation, ArrowRight, Info } from 'lucide-react';
import type { OperatorTrip, OperatorTripRoute } from '@/data/operator/trips';

interface TripRouteTabProps {
  trip: OperatorTrip;
  route?: OperatorTripRoute | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function TripRouteTab({ trip, route }: TripRouteTabProps) {
  const stops = route?.stops ?? [];

  if (!route) {
    return (
      <div className="text-center py-12">
        <Navigation className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground/80 mb-1">No Route Information</h3>
        <p className="text-sm text-muted-foreground">
          Route details are not available for this trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Route Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{route.routeNumber}</p>
            <p className="text-xs text-primary font-medium mt-1">Route Number</p>
          </div>
          <div className="bg-success/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-success">{route.distanceKm} km</p>
            <p className="text-xs text-success font-medium mt-1">Total Distance</p>
          </div>
          <div className="bg-warning/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">
              {Math.floor(route.estimatedDurationMinutes / 60)}h{' '}
              {route.estimatedDurationMinutes % 60}m
            </p>
            <p className="text-xs text-warning font-medium mt-1">Est. Duration</p>
          </div>
          <div className="bg-[hsl(var(--purple-50))] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--purple-700))]">{stops.length}</p>
            <p className="text-xs text-[hsl(var(--purple-600))] font-medium mt-1">Total Stops</p>
          </div>
        </div>

        {route.description && (
          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
            <Info className="w-4 h-4 text-muted-foreground/70 mt-0.5 shrink-0" />
            <p>{route.description}</p>
          </div>
        )}
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-success/10 border border-success/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <p className="text-xs font-semibold text-success uppercase tracking-wide">Origin</p>
          </div>
          <p className="text-lg font-bold text-success">{route.origin}</p>
          <p className="text-xs text-success mt-1">Route Group: {route.routeGroupCode}</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Destination</p>
          </div>
          <p className="text-lg font-bold text-destructive">{route.destination}</p>
          <p className="text-xs text-destructive mt-1">Route Group: {route.routeGroupName}</p>
        </div>
      </div>

      {/* Stops */}
      {stops.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h3 className="text-base font-semibold text-foreground">
              Stops ({stops.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-3">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center shrink-0 w-6">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      stop.isTerminal
                        ? 'bg-primary/80 border-primary'
                        : 'bg-card border-border'
                    }`}
                  />
                  {idx < stops.length - 1 && (
                    <div className="w-0.5 h-5 bg-secondary mt-1" />
                  )}
                </div>

                {/* Stop number */}
                <span className="text-xs font-mono text-muted-foreground/70 w-5 shrink-0">
                  {stop.stopOrder}
                </span>

                {/* Stop name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                    <p className={`text-sm ${stop.isTerminal ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {stop.stopName}
                    </p>
                    {stop.stopCode && (
                      <span className="text-xs text-muted-foreground/70 font-mono">({stop.stopCode})</span>
                    )}
                    {stop.isTerminal && (
                      <span className="text-xs bg-primary/15 text-primary font-medium px-1.5 py-0.5 rounded">
                        Terminal
                      </span>
                    )}
                  </div>
                </div>

                {/* Timing */}
                {(stop.arrivalOffset !== undefined || stop.departureOffset !== undefined) && (
                  <div className="text-right shrink-0">
                    {stop.arrivalOffset !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        +{stop.arrivalOffset} min
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 bg-muted border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
              Terminal stop
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-card" />
              Intermediate stop
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Offset from departure
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
