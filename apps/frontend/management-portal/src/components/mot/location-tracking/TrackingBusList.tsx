'use client';

import React, { useMemo } from 'react';
import {
  Bus,
  Navigation,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MapPin,
  Gauge,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { TrackedBus } from '@/types/location-tracking';

// ── Props ─────────────────────────────────────────────────────────

interface TrackingBusListProps {
  /** Array of tracked buses */
  buses: TrackedBus[];
  /** Currently selected bus */
  selectedBus: TrackedBus | null;
  /** Callback when a bus is selected */
  onBusSelect: (bus: TrackedBus) => void;
  /** Callback when a bus is focused (center map) */
  onBusFocus: (bus: TrackedBus) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the list is collapsed */
  isCollapsed?: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse?: () => void;
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

function getStatusBadge(bus: TrackedBus) {
  const status = bus.trip?.status;

  switch (status) {
    case 'on_time':
    case 'in_transit':
      return { label: 'On Time', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    case 'delayed':
      return { label: 'Delayed', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    case 'scheduled':
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock };
    case 'completed':
      return { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle };
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-600', icon: Clock };
  }
}

// ── Bus List Item Component ───────────────────────────────────────

interface BusListItemProps {
  bus: TrackedBus;
  isSelected: boolean;
  onSelect: () => void;
  onFocus: () => void;
}

function BusListItem({ bus, isSelected, onSelect, onFocus }: BusListItemProps) {
  const isOnline = bus.deviceStatus === 'online';
  const isMoving = bus.movementStatus === 'moving';
  const statusBadge = getStatusBadge(bus);
  const StatusIcon = statusBadge.icon;

  return (
    <div
      onClick={onSelect}
      className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected
        ? 'bg-blue-50 border-blue-300 shadow-sm'
        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Bus Icon with status indicator */}
          <div className="relative">
            <div
              className={`p-1.5 rounded-lg ${isOnline
                ? isMoving
                  ? 'bg-green-100'
                  : 'bg-gray-100'
                : 'bg-red-100'
                }`}
            >
              {isMoving ? (
                <Navigation className={`h-4 w-4 ${isOnline ? 'text-green-600' : 'text-gray-400'}`} />
              ) : (
                <Bus className={`h-4 w-4 ${isOnline ? 'text-gray-600' : 'text-red-500'}`} />
              )}
            </div>
            {/* Online/Offline indicator dot */}
            <div
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {bus.bus.registrationNumber}
            </h4>
            <p className="text-xs text-gray-500">{bus.bus.operatorName}</p>
          </div>
        </div>

        {/* Focus button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocus();
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-100 transition-all"
          title="Center on map"
        >
          <MapPin className="h-4 w-4 text-blue-600" />
        </button>
      </div>

      {/* Route Info */}
      {bus.route && (
        <div className="mb-2">
          <p className="text-xs text-gray-600 truncate">{bus.route.name}</p>
        </div>
      )}

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {/* Device Status */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
        >
          {isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Trip Status */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
        >
          <StatusIcon className="h-2.5 w-2.5" />
          {statusBadge.label}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Speed */}
        {isOnline && (
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            <span>{bus.location.speed} km/h</span>
          </div>
        )}

        {/* Progress */}
        {bus.trip?.progress !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${bus.trip.progress}%` }}
              />
            </div>
            <span>{bus.trip.progress}%</span>
          </div>
        )}

        {/* Passengers */}
        {bus.trip?.passengersOnboard !== undefined && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{bus.trip.passengersOnboard}</span>
          </div>
        )}

        {/* Last update */}
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          <span>{formatTime(bus.lastUpdate)}</span>
        </div>
      </div>

      {/* Next Stop (if available) */}
      {bus.nextStop && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">Next: {bus.nextStop.name}</span>
          <span className="text-gray-600 font-medium">
            ETA {formatTime(bus.nextStop.estimatedArrival)}
          </span>
        </div>
      )}

      {/* Alerts indicator */}
      {bus.alerts && bus.alerts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {bus.alerts.length} active {bus.alerts.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function TrackingBusList({
  buses,
  selectedBus,
  onBusSelect,
  onBusFocus,
  isLoading,
  error,
  isCollapsed = false,
  onToggleCollapse,
}: TrackingBusListProps) {
  // Group buses by status
  const groupedBuses = useMemo(() => {
    const online = buses.filter((b) => b.deviceStatus === 'online');
    const offline = buses.filter((b) => b.deviceStatus === 'offline');
    const delayed = buses.filter((b) => b.trip?.status === 'delayed');

    return {
      online,
      offline,
      delayed,
      moving: online.filter((b) => b.movementStatus === 'moving'),
      idle: online.filter((b) => b.movementStatus !== 'moving'),
    };
  }, [buses]);

  if (error && !isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex justify-end p-2 border-b border-gray-100">
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Buses</h3>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="flex lg:flex-col items-center justify-between lg:justify-start h-full w-full bg-gray-50 p-2 lg:py-4 border-t lg:border-t-0 lg:border-l border-gray-200">
        <button
          onClick={onToggleCollapse}
          className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-sm border border-gray-200 text-gray-600 transition-colors"
          title="Expand Bus List"
        >
          <ChevronLeft className="h-5 w-5 hidden lg:block" />
          <ChevronUp className="h-5 w-5 block lg:hidden" />
        </button>
        <div className="flex lg:flex-col items-center gap-2 lg:gap-4 text-gray-400 lg:mt-6">
          <Bus className="h-5 w-5" />
          <div className="text-xs font-medium lg:rotate-90 whitespace-nowrap lg:mt-8 tracking-widest uppercase hidden lg:block">
            Tracked Buses
          </div>
          <div className="text-xs font-medium tracking-widest uppercase lg:hidden">
            Tracked Buses
          </div>
        </div>
        <div className="w-10 lg:hidden" /> {/* Spacer */}
      </div>
    );
  }

  if (isLoading && buses.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex justify-end p-2 border-b border-gray-100">
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading buses...</p>
        </div>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex justify-end p-2 border-b border-gray-100">
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <Bus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buses Found</h3>
          <p className="text-gray-600 text-sm">
            No buses match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Tracked Buses</h3>
            <span className="text-sm text-gray-500">({buses.length})</span>
          </div>
          <button onClick={onToggleCollapse} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
            <ChevronRight className="h-5 w-5 hidden lg:block" />
            <ChevronDown className="h-5 w-5 block lg:hidden" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {groupedBuses.moving.length} moving
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            {groupedBuses.idle.length} idle
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {groupedBuses.offline.length} offline
          </span>
          {groupedBuses.delayed.length > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {groupedBuses.delayed.length} delayed
            </span>
          )}
        </div>
      </div>

      {/* Bus List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {buses.map((bus) => (
          <BusListItem
            key={bus.id}
            bus={bus}
            isSelected={selectedBus?.id === bus.id}
            onSelect={() => onBusSelect(bus)}
            onFocus={() => onBusFocus(bus)}
          />
        ))}
      </div>
    </div>
  );
}
