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
import type { TrackedBus } from '@/types/location-tracking';

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
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delayed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getMovementStatusColor(status?: string): string {
  switch (status) {
    case 'moving':
      return 'bg-green-100 text-green-700';
    case 'idle':
      return 'bg-amber-100 text-amber-700';
    case 'stopped':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
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
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-[380px] max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {bus.bus.registrationNumber}
            </h3>
            <p className="text-blue-100 text-xs">
              {bus.bus.make} {bus.bus.model}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close popup"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Status Badges */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-wrap">
        {/* Device Status */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Current Location
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Latitude</span>
                <p className="font-medium text-gray-900">{formatCoordinate(lat, 'lat')}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Longitude</span>
                <p className="font-medium text-gray-900">{formatCoordinate(lng, 'lng')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <Gauge className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{bus.location.speed} km/h</p>
                <span className="text-xs text-gray-500">Speed</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{bus.location.heading}°</p>
                <span className="text-xs text-gray-500">{getHeadingDirection(bus.location.heading)}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500">
                  <Timer className="h-3.5 w-3.5" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{formatTime(bus.location.timestamp)}</p>
                <span className="text-xs text-gray-500">Updated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {bus.route && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Route className="h-3 w-3" />
              Route Information
            </h4>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900 text-sm">{bus.route.name}</p>
                {onViewRoute && (
                  <button
                    onClick={() => onViewRoute(bus.route!.id)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-600 gap-1">
                <span>{bus.route.startStop}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span>{bus.route.endStop}</span>
              </div>
              {/* Trip Progress */}
              {bus.trip && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Trip Progress</span>
                    <span className="font-medium text-gray-900">{bus.trip.progress}%</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
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
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Next Stop
            </h4>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{bus.nextStop.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ~{bus.nextStop.distance?.toFixed(1)} km away
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700 text-sm">
                    ETA: {formatTime(bus.nextStop.estimatedArrival)}
                  </p>
                  {bus.nextStop.scheduledArrival && (
                    <p className="text-xs text-gray-500">
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
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Upcoming Stops
            </h4>
            <div className="space-y-1.5">
              {bus.upcomingStops.slice(0, 3).map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 rounded"
                >
                  <span className="text-gray-700">{stop.name}</span>
                  <span className="text-gray-500 text-xs">{formatTime(stop.estimatedArrival)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passengers */}
        {bus.trip?.passengersOnboard !== undefined && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="bg-purple-100 rounded-full p-2">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {bus.trip.passengersOnboard} passengers
              </p>
              <p className="text-xs text-gray-500">
                Capacity: {bus.bus.capacity} ({Math.round((bus.trip.passengersOnboard / bus.bus.capacity) * 100)}% full)
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {bus.alerts && bus.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Active Alerts
            </h4>
            <div className="space-y-2">
              {bus.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-lg border ${
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'medium'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(alert.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bus Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Bus className="h-3 w-3" />
            Bus Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500 text-xs">Type</span>
              <p className="font-medium text-gray-900 capitalize">{bus.bus.type || 'Standard'}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500 text-xs">Capacity</span>
              <p className="font-medium text-gray-900">{bus.bus.capacity} seats</p>
            </div>
            <div className="bg-gray-50 rounded p-2 col-span-2">
              <span className="text-gray-500 text-xs">Operator</span>
              <p className="font-medium text-gray-900">{bus.bus.operatorName || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
        {onViewFullDetails && (
          <button
            onClick={() => onViewFullDetails(bus)}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
          className="py-2 px-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <MapPin className="h-3.5 w-3.5" />
          Maps
        </button>
      </div>
    </div>
  );
}
