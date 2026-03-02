// Location Tracking Mock Data Service
// =============================================================================
// Comprehensive mock data for the MOT Location Tracking feature.
// This service now uses a real-time simulation engine that:
// - Simulates buses running on schedules throughout the day (5 AM - 11 PM)
// - Calculates positions based on current time and route waypoints
// - Shows realistic statuses, speeds, and delays
// - Repeats daily for consistent demonstration
//
// Backend endpoints (planned):
//   GET /api/tracking/buses           — All tracked buses with locations
//   GET /api/tracking/buses/:id       — Single bus details
//   GET /api/tracking/stats           — Tracking statistics
//   GET /api/tracking/routes          — Routes with active buses
//   WS  /api/tracking/live            — WebSocket for real-time updates

import type {
  TrackedBus,
  BusInfo,
  RouteInfo,
  TrackingStats,
  TrackingFilterOptions,
  BusLocationData,
  TripStatus,
  StopInfo,
  BusAlert,
  TrackingStatsCardMetric,
} from '@/types/location-tracking';
import {
  Bus,
  Navigation,
  Wifi,
  Clock,
  AlertTriangle,
  Gauge,
} from 'lucide-react';
import {
  getAllSimulatedBusStates,
  getBusDefinition,
  getRoutePath,
  ROUTE_PATHS,
  type RoutePathDefinition,
  type SimulatedBusState,
} from './location-tracking-simulation';
import { BUS_FLEET } from './buses';

// ── Routes Data (derived from simulation) ───────────────────────────────────

const ROUTES: RouteInfo[] = [
  {
    id: 'route-001',
    name: 'Colombo - Kandy Express',
    shortName: 'CBK-EXP',
    startStop: 'Colombo Fort',
    endStop: 'Kandy Bus Stand',
    totalStops: 17,
    estimatedDuration: 50, // matches 1-hour simulation window
    distance: 115,
  },
  {
    id: 'route-002',
    name: 'Colombo - Galle Highway',
    shortName: 'CGL-HWY',
    startStop: 'Colombo Fort',
    endStop: 'Galle Bus Stand',
    totalStops: 17,
    estimatedDuration: 45, // matches 1-hour simulation window
    distance: 126,
  },
];

// ── Operators ───────────────────────────────────────────────────────────────

const OPERATORS = [
  { id: 'op-001', name: 'Lanka Ashok Leyland' },
  { id: 'op-002', name: 'Highway Kings' },
];

// ── Default Map Settings ────────────────────────────────────────────────────

const COLOMBO = { lat: 6.9271, lng: 79.8612 };

/**
 * Default map center (Colombo, Sri Lanka)
 */
export const DEFAULT_MAP_CENTER = COLOMBO;

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 11;

/**
 * Auto-refresh interval in milliseconds
 */
export const AUTO_REFRESH_INTERVAL = 3000; // 3 seconds for smooth updates

// ── Simulation-Based Data Generation ────────────────────────────────────────

/**
 * Convert SimulatedBusState to TrackedBus format
 */
function convertToTrackedBus(state: SimulatedBusState, now: Date): TrackedBus {
  const busDef = getBusDefinition(state.busId);
  const routePath = getRoutePath(state.routeId);
  const route = ROUTES.find((r) => r.id === state.routeId);

  if (!busDef || !route) {
    throw new Error(`Bus definition or route not found for ${state.busId}`);
  }

  // Get stop names from route path
  const stops = routePath?.waypoints.filter((w) => w.isStop).map((w) => w.name || 'Stop') || [];

  // Find next stop
  let nextStop: StopInfo | undefined;
  if (state.nextStopName && state.nextStopEta) {
    nextStop = {
      id: `stop-${state.currentStopIndex + 1}`,
      name: state.nextStopName,
      estimatedArrival: state.nextStopEta.toISOString(),
      distance: Math.round((100 - state.progress) * (route.distance || 100) / 100),
    };
  }

  // Generate upcoming stops
  const upcomingStops: StopInfo[] = [];
  const currentStopIdx = Math.floor(state.progress / 100 * stops.length);
  for (let i = currentStopIdx + 1; i < Math.min(currentStopIdx + 4, stops.length); i++) {
    const etaMinutes = (i - currentStopIdx) * Math.round((route.estimatedDuration || 120) / stops.length);
    upcomingStops.push({
      id: `stop-${i}`,
      name: stops[i] || `Stop ${i}`,
      estimatedArrival: new Date(now.getTime() + etaMinutes * 60 * 1000).toISOString(),
      distance: Math.round((i / stops.length) * (route.distance || 100) - state.progress / 100 * (route.distance || 100)),
    });
  }

  // Generate alerts based on status
  const alerts: BusAlert[] = [];
  if (state.status === 'delayed' && state.delayMinutes > 5) {
    alerts.push({
      id: `alert-${state.busId}-delay`,
      type: 'delay',
      severity: state.delayMinutes > 15 ? 'high' : 'medium',
      message: `Bus delayed by ${state.delayMinutes} minutes due to traffic congestion`,
      timestamp: new Date(now.getTime() - state.delayMinutes * 60 * 1000).toISOString(),
    });
  }

  // Map internal status to TripStatus
  const tripStatus: TripStatus =
    state.status === 'idle_at_stop' ? 'in_transit' :
      state.status === 'off_duty' ? 'scheduled' :
        state.status as TripStatus;

  const location: BusLocationData = {
    busId: state.busId,
    tripId: state.tripId || undefined,
    location: {
      type: 'Point',
      coordinates: [state.position.lng, state.position.lat],
    },
    speed: state.speed,
    heading: Math.round(state.heading),
    timestamp: state.lastUpdate.toISOString(),
    accuracy: 5 + Math.random() * 10,
  };

  const departureTime = state.tripId
    ? new Date(now.getTime() - (state.progress / 100) * (route.estimatedDuration || 120) * 60 * 1000)
    : now;
  const arrivalTime = state.tripId
    ? new Date(now.getTime() + ((100 - state.progress) / 100) * (route.estimatedDuration || 120) * 60 * 1000)
    : new Date(now.getTime() + (route.estimatedDuration || 120) * 60 * 1000);

  return {
    id: `tracked-${state.busId}`,
    bus: {
      id: busDef.id,
      registrationNumber: busDef.registrationNumber,
      make: busDef.make,
      model: busDef.model,
      capacity: busDef.capacity,
      type: busDef.type,
      operatorId: busDef.operatorId,
      operatorName: busDef.operatorName,
    },
    route,
    schedule: {
      id: `schedule-${state.busId}`,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      frequency: busDef.frequency <= 90 ? 'High Frequency' : busDef.frequency <= 180 ? 'Regular' : 'Express',
    },
    trip: state.tripId ? {
      id: state.tripId,
      status: tripStatus,
      progress: state.progress,
      passengersOnboard: state.passengersOnboard,
    } : undefined,
    location,
    deviceStatus: state.deviceStatus,
    movementStatus: state.movementStatus,
    nextStop,
    upcomingStops: upcomingStops.length > 0 ? upcomingStops : undefined,
    alerts: alerts.length > 0 ? alerts : undefined,
    lastUpdate: state.lastUpdate.toISOString(),
  };
}

// ── Data Cache ──────────────────────────────────────────────────────────────

let cachedBuses: TrackedBus[] | null = null;
let lastGenerated: Date | null = null;

/**
 * Get all tracked buses with their current locations.
 * Uses real-time simulation based on current time of day.
 */
export function getTrackedBuses(forceRefresh: boolean = false): TrackedBus[] {
  const now = new Date();

  // Always regenerate for fresh simulation data (based on current time)
  // Cache for 1 second to prevent excessive recalculation
  if (!cachedBuses || forceRefresh || !lastGenerated || (now.getTime() - lastGenerated.getTime() > 1000)) {
    const simulatedStates = getAllSimulatedBusStates(now);
    cachedBuses = simulatedStates.map((state) => convertToTrackedBus(state, now));
    lastGenerated = now;
  }

  return cachedBuses;
}

/**
 * Get a single tracked bus by ID
 */
export function getTrackedBusById(busId: string): TrackedBus | undefined {
  const buses = getTrackedBuses();
  return buses.find((b) => b.bus.id === busId || b.id === busId);
}

/**
 * Get tracking statistics
 */
export function getTrackingStats(): TrackingStats {
  const buses = getTrackedBuses();

  const activeBuses = buses.filter((b) => b.movementStatus === 'moving').length;
  const idleBuses = buses.filter((b) => b.movementStatus === 'idle').length;
  const offlineBuses = buses.filter((b) => b.deviceStatus === 'offline').length;
  const onTimeBuses = buses.filter((b) => b.trip?.status === 'on_time' || b.trip?.status === 'in_transit').length;
  const delayedBuses = buses.filter((b) => b.trip?.status === 'delayed').length;

  const onlineBuses = buses.filter((b) => b.deviceStatus === 'online');
  const avgSpeed = onlineBuses.length > 0
    ? onlineBuses.reduce((sum, b) => sum + b.location.speed, 0) / onlineBuses.length
    : 0;

  const totalPassengers = buses.reduce((sum, b) => sum + (b.trip?.passengersOnboard || 0), 0);

  const activeRoutes = new Set(buses.filter((b) => b.deviceStatus === 'online' && b.trip).map((b) => b.route?.id)).size;

  const allAlerts = buses.flatMap((b) => b.alerts || []);

  return {
    totalBusesTracking: buses.length,
    activeBuses,
    idleBuses,
    offlineBuses,
    busesOnTime: onTimeBuses,
    busesDelayed: delayedBuses,
    averageSpeed: Math.round(avgSpeed * 10) / 10,
    totalPassengers,
    activeRoutes,
    alerts: {
      total: allAlerts.length,
      critical: allAlerts.filter((a) => a.severity === 'critical').length,
      high: allAlerts.filter((a) => a.severity === 'high').length,
      medium: allAlerts.filter((a) => a.severity === 'medium').length,
      low: allAlerts.filter((a) => a.severity === 'low').length,
    },
  };
}

/**
 * Get stats card metrics for the dashboard
 */
export function getTrackingStatsMetrics(): TrackingStatsCardMetric[] {
  const stats = getTrackingStats();
  const now = new Date();
  const hours = now.getHours();

  // Generate realistic spark data based on time of day
  const generateSparkData = (base: number, variance: number): number[] => {
    const data: number[] = [];
    for (let i = 0; i < 6; i++) {
      data.push(Math.max(0, base + Math.floor((Math.random() - 0.5) * variance)));
    }
    return data;
  };

  // Check if outside operating hours
  const isOperating = hours >= 5 && hours < 23;
  const operatingNote = isOperating ? 'Real-time' : 'Off-hours';

  return [
    {
      id: 'total-tracking',
      label: 'Buses Tracking',
      value: stats.totalBusesTracking.toString(),
      trend: 'stable',
      trendValue: operatingNote,
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: generateSparkData(stats.totalBusesTracking, 5),
      icon: Bus,
    },
    {
      id: 'active-buses',
      label: 'Active (Moving)',
      value: stats.activeBuses.toString(),
      trend: stats.activeBuses > 20 ? 'up' : 'down',
      trendValue: `${stats.totalBusesTracking > 0 ? Math.round((stats.activeBuses / stats.totalBusesTracking) * 100) : 0}% of fleet`,
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: generateSparkData(stats.activeBuses, 10),
      icon: Navigation,
    },
    {
      id: 'online-devices',
      label: 'Online Devices',
      value: (stats.totalBusesTracking - stats.offlineBuses).toString(),
      trend: stats.offlineBuses < 3 ? 'up' : 'down',
      trendValue: `${stats.offlineBuses} offline`,
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: generateSparkData(stats.totalBusesTracking - stats.offlineBuses, 3),
      icon: Wifi,
    },
    {
      id: 'on-time',
      label: 'On Time',
      value: stats.busesOnTime.toString(),
      trend: stats.busesOnTime > stats.busesDelayed ? 'up' : 'down',
      trendValue: `${stats.totalBusesTracking > 0 ? Math.round((stats.busesOnTime / stats.totalBusesTracking) * 100) : 0}% punctuality`,
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: generateSparkData(stats.busesOnTime, 8),
      icon: Clock,
    },
    {
      id: 'delayed',
      label: 'Delayed',
      value: stats.busesDelayed.toString(),
      trend: stats.busesDelayed > 5 ? 'up' : 'down',
      trendValue: stats.busesDelayed > 5 ? 'Needs attention' : 'Within limits',
      trendPositiveIsGood: false,
      color: stats.busesDelayed > 5 ? 'red' : 'amber',
      sparkData: generateSparkData(stats.busesDelayed, 3),
      icon: AlertTriangle,
    },
    {
      id: 'avg-speed',
      label: 'Avg Speed',
      value: `${stats.averageSpeed} km/h`,
      trend: stats.averageSpeed > 35 ? 'up' : 'down',
      trendValue: 'Fleet average',
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: generateSparkData(Math.round(stats.averageSpeed), 15),
      icon: Gauge,
    },
  ];
}

/**
 * Get filter options
 */
export function getTrackingFilterOptions(): TrackingFilterOptions {
  return {
    routes: ROUTES.map((r) => ({ id: r.id, name: r.name })),
    operators: OPERATORS,
    tripStatuses: ['scheduled', 'in_transit', 'on_time', 'delayed', 'completed', 'cancelled'],
  };
}

/**
 * Get route information by ID
 */
export function getRouteById(routeId: string): RouteInfo | undefined {
  return ROUTES.find((r) => r.id === routeId);
}

/**
 * Get all routes
 */
export function getAllRoutes(): RouteInfo[] {
  return ROUTES;
}

/**
 * Simulate real-time location update for a single bus
 * Returns updated location data
 */
export function simulateLocationUpdate(busId: string): BusLocationData | null {
  const now = new Date();
  const states = getAllSimulatedBusStates(now);
  const state = states.find((s) => s.busId === busId);

  if (!state || state.deviceStatus !== 'online') return null;

  return {
    busId: state.busId,
    tripId: state.tripId || undefined,
    location: {
      type: 'Point',
      coordinates: [state.position.lng, state.position.lat],
    },
    speed: state.speed,
    heading: Math.round(state.heading),
    timestamp: state.lastUpdate.toISOString(),
    accuracy: 5 + Math.random() * 10,
  };
}

// Re-export route path utilities for components that need waypoint data
export { getRoutePath, ROUTE_PATHS } from './location-tracking-simulation';
