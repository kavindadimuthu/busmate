'use client';

import React from 'react';
import {
  X,
  Bus,
  MapPin,
  Navigation,
  Clock,
  Users,
  Route,
  Gauge,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Phone,
  Wifi,
  WifiOff,
  ArrowRight,
  Timer,
  Compass,
} from 'lucide-react';
import type { TrackedBus } from '@/types/LocationTracking';

// ── Props ─────────────────────────────────────────────────────────

interface BusDetailPopupProps {
  /** The tracked bus data to display */
  bus: TrackedBus;
  /** Callback to close the popup */
  onClose: () => void;
  /** Optional callback to view full details */
  onViewFullDetails?: (bus: TrackedBus) => void;
  /** Optional callback to focus on route */
  onViewRoute?: (routeId: string) => void;
}

// ── Helper Functions ──────────────────────────────────────────────

function formatTime(dateString?: string): string {
  if (!dateString) return '--';
  try {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

function formatCoordinate(coord: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' 
    ? (coord >= 0 ? 'N' : 'S')
    : (coord >= 0 ? 'E' : 'W');
  return `${Math.abs(coord).toFixed(5)}° ${direction}`;
}

function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'on_time':
    case 'in_transit':
      return 'bg-success/15 text-success border-success/20';
    case 'delayed':
      return 'bg-destructive/15 text-destructive border-destructive/20';
    case 'scheduled':
      return 'bg-primary/15 text-primary border-primary/20';
    case 'completed':
      return 'bg-muted text-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getMovementStatusColor(status?: string): string {
  switch (status) {
    case 'moving':
      return 'bg-success/15 text-success';
    case 'idle':
      return 'bg-warning/15 text-warning';
    case 'stopped':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getHeadingDirection(heading?: number): string {
  if (heading === undefined) return 'Unknown';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Detailed popup component for displaying bus information.
 * Shows comprehensive data when a bus marker is clicked.
 */
export function BusDetailPopup({
  bus,
  onClose,
  onViewFullDetails,
  onViewRoute,
}: BusDetailPopupProps) {
  const [lng, lat] = bus.location.location.coordinates;
  const isOnline = bus.deviceStatus === 'online';

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border w-[380px] max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-card/20 rounded-lg p-2">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {bus.bus.registrationNumber}
            </h3>
            <p className="text-primary/20 text-xs">
              {bus.bus.make} {bus.bus.model}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-card/20 rounded-lg transition-colors"
          aria-label="Close popup"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Status Badges */}
      <div className="px-4 py-2 bg-muted border-b border-border flex items-center gap-2 flex-wrap">
        {/* Device Status */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
        }`}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Trip Status */}
        {bus.trip?.status && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(bus.trip.status)}`}>
            {bus.trip.status === 'delayed' ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {bus.trip.status.replace('_', ' ')}
          </span>
        )}

        {/* Movement Status */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getMovementStatusColor(bus.movementStatus)}`}>
          <Navigation className="h-3 w-3" />
          {bus.movementStatus}
        </span>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Location Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Current Location
          </h4>
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Latitude</span>
                <p className="font-medium text-foreground">{formatCoordinate(lat, 'lat')}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Longitude</span>
                <p className="font-medium text-foreground">{formatCoordinate(lng, 'lng')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-foreground text-sm">{bus.location.speed} km/h</p>
                <span className="text-xs text-muted-foreground">Speed</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-foreground text-sm">{bus.location.heading}°</p>
                <span className="text-xs text-muted-foreground">{getHeadingDirection(bus.location.heading)}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-foreground text-sm">{formatTime(bus.location.timestamp)}</p>
                <span className="text-xs text-muted-foreground">Updated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {bus.route && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Route className="h-3 w-3" />
              Route Information
            </h4>
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground text-sm">{bus.route.name}</p>
                {onViewRoute && (
                  <button
                    onClick={() => onViewRoute(bus.route!.id)}
                    className="text-primary hover:text-primary text-xs font-medium flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                <span>{bus.route.startStop}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/70" />
                <span>{bus.route.endStop}</span>
              </div>
              {/* Trip Progress */}
              {bus.trip && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Trip Progress</span>
                    <span className="font-medium text-foreground">{bus.trip.progress}%</span>
                  </div>
                  <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${bus.trip.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Stop */}
        {bus.nextStop && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Next Stop
            </h4>
            <div className="bg-success/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{bus.nextStop.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ~{bus.nextStop.distance?.toFixed(1)} km away
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-success text-sm">
                    ETA: {formatTime(bus.nextStop.estimatedArrival)}
                  </p>
                  {bus.nextStop.scheduledArrival && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {formatTime(bus.nextStop.scheduledArrival)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Stops */}
        {bus.upcomingStops && bus.upcomingStops.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Upcoming Stops
            </h4>
            <div className="space-y-1.5">
              {bus.upcomingStops.slice(0, 3).map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center justify-between text-sm py-1.5 px-2 bg-muted rounded"
                >
                  <span className="text-foreground/80">{stop.name}</span>
                  <span className="text-muted-foreground text-xs">{formatTime(stop.estimatedArrival)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passengers */}
        {bus.trip?.passengersOnboard !== undefined && (
          <div className="flex items-center gap-3 p-3 bg-[hsl(var(--purple-50))] rounded-lg">
            <div className="bg-[hsl(var(--purple-100))] rounded-full p-2">
              <Users className="h-4 w-4 text-[hsl(var(--purple-600))]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {bus.trip.passengersOnboard} passengers
              </p>
              <p className="text-xs text-muted-foreground">
                Capacity: {bus.bus.capacity} ({Math.round((bus.trip.passengersOnboard / bus.bus.capacity) * 100)}% full)
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {bus.alerts && bus.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Active Alerts
            </h4>
            <div className="space-y-2">
              {bus.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-lg border ${
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'bg-destructive/10 border-destructive/20'
                      : alert.severity === 'medium'
                      ? 'bg-warning/10 border-warning/20'
                      : 'bg-muted border-border'
                  }`}
                >
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(alert.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bus Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Bus className="h-3 w-3" />
            Bus Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted rounded p-2">
              <span className="text-muted-foreground text-xs">Type</span>
              <p className="font-medium text-foreground capitalize">{bus.bus.type || 'Standard'}</p>
            </div>
            <div className="bg-muted rounded p-2">
              <span className="text-muted-foreground text-xs">Capacity</span>
              <p className="font-medium text-foreground">{bus.bus.capacity} seats</p>
            </div>
            <div className="bg-muted rounded p-2 col-span-2">
              <span className="text-muted-foreground text-xs">Operator</span>
              <p className="font-medium text-foreground">{bus.bus.operatorName || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-muted border-t border-border flex gap-2">
        {onViewFullDetails && (
          <button
            onClick={() => onViewFullDetails(bus)}
            className="flex-1 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors flex items-center justify-center gap-2"
          >
            View Full Details
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => {
            // Open Google Maps with the bus location
            window.open(
              `https://www.google.com/maps?q=${lat},${lng}`,
              '_blank'
            );
          }}
          className="py-2 px-3 border border-border text-foreground/80 rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
        >
          <MapPin className="h-3.5 w-3.5" />
          Maps
        </button>
      </div>
    </div>
  );
}
