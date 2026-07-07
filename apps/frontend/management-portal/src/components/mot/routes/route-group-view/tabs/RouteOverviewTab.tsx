'use client';

import {
  Navigation,
  Ruler,
  Clock,
  MapPin,
  Hash,
  FileText,
  Route as RouteIcon,
  Navigation2,
} from 'lucide-react';
import type { RouteResponse } from '@busmate/api-client-route';

// ── Types ─────────────────────────────────────────────────────────

interface RouteOverviewTabProps {
  route: RouteResponse;
}

// ── Helper functions ──────────────────────────────────────────────

function formatDuration(minutes?: number): string {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

// ── Component ─────────────────────────────────────────────────────

export function RouteOverviewTab({ route }: RouteOverviewTabProps) {
  // Count stops
  const intermediateStops = route.routeStops?.length || 0;
  const totalStops = intermediateStops + 2; // +2 for start and end

  const isOutbound = route.direction === 'OUTBOUND';
  const directionColor = isOutbound
    ? { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
    : { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };

  return (
    <div className="space-y-6">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Direction */}
        <div className="bg-muted rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Navigation
              className={`w-4 h-4 ${isOutbound ? 'rotate-45' : '-rotate-[135deg]'} ${
                isOutbound ? 'text-success' : 'text-primary/90'
              }`}
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Direction
            </span>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-lg ${directionColor.bg} ${directionColor.text} ${directionColor.border} border`}
          >
            {route.direction}
          </span>
        </div>

        {/* Distance */}
        <div className="bg-muted rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Distance
            </span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {route.distanceKm?.toFixed(1) || '0'}{' '}
            <span className="text-sm font-normal text-muted-foreground">km</span>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-muted rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Est. Duration
            </span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {formatDuration(route.estimatedDurationMinutes)}
          </div>
        </div>

        {/* Stops */}
        <div className="bg-muted rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Stops
            </span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {totalStops}{' '}
            <span className="text-sm font-normal text-muted-foreground">stops</span>
          </div>
        </div>
      </div>

      {/* Route details grid */}
      <div className="bg-muted rounded-xl p-6 border border-border/50">
        {/* <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4">
          Route Details
        </h4> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8">
          {/* Route ID */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-sm text-muted-foreground">Route ID</span>
            </div>
            <span className="font-mono text-xs bg-secondary px-2 py-1 rounded text-foreground/80">
              {route.id?.slice(0, 12)}...
            </span>
          </div>

          {/* Route Number */}
          {route.routeNumber && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-muted-foreground/70" />
                <span className="text-sm text-muted-foreground">Route Number</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {route.routeNumber}
              </span>
            </div>
          )}

          {/* Road Type */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-sm text-muted-foreground">Road Type</span>
            </div>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded ${
                route.roadType === 'EXPRESSWAY'
                  ? 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]'
                  : 'bg-secondary text-foreground/80'
              }`}
            >
              {route.roadType || 'Normal'}
            </span>
          </div>

          {/* Route through */}
          {route.routeThrough && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Navigation2 className="w-4 h-4 text-muted-foreground/70" />
                <span className="text-sm text-muted-foreground">Route Through</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{route.routeThrough}</span>
            </div>
          )}

          {/* Created */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm text-foreground">{formatDate(route.createdAt)}</span>
          </div>

          {/* Updated */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm text-foreground">{formatDate(route.updatedAt)}</span>
          </div>

          {/* Created By */}
          {route.createdBy && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Created By</span>
              <span className="text-sm text-foreground">{route.createdBy}</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey path visual */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-border/50">
        <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4">
          Journey Path
        </h4>
        <div className="flex items-center gap-4">
          {/* Start */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {route.startStopName || 'Start'}
              </div>
              <div className="text-xs text-muted-foreground">Origin</div>
            </div>
          </div>

          {/* Path */}
          <div className="flex-1 relative">
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-red-400 rounded-full" />
            {intermediateStops > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-card border border-border rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                  <MapPin className="w-3 h-3" />
                  {intermediateStops} stops
                </span>
              </div>
            )}
          </div>

          {/* End */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground text-right">
                {route.endStopName || 'End'}
              </div>
              <div className="text-xs text-muted-foreground text-right">Destination</div>
            </div>
            <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
