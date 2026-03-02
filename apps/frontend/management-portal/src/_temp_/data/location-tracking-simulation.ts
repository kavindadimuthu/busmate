// =============================================================================
// Location Tracking Simulation — Adapter Layer
// =============================================================================
// This module delegates to the `_temp_` simulation engine while preserving
// the public API that the rest of the application (location-tracking.ts,
// useLocationTracking, UI components) depends on.
//
// When a real GPS tracking backend is implemented, replace this file with
// an adapter that calls the actual API / WebSocket connection instead.

import { LocationSimulationService } from '@/_temp_/services';
import {
  ROUTES as TEMP_ROUTES,
} from './routes';
import {
  BUS_FLEET as TEMP_BUS_FLEET,
} from './buses';
import type {
  SimulatedBusState as TempSimulatedBusState,
  Waypoint as TempWaypoint,
  RouteDefinition,
  BusDefinition as TempBusDefinition,
} from './types';
import {
  interpolatePositionOnPath as tempInterpolatePosition,
  calculateDistance as tempCalculateDistance,
  calculateHeading as tempCalculateHeading,
} from '@/_temp_/utils';

// ── Re-exported Types ───────────────────────────────────────────────────────
// These maintain backward compatibility with existing consumers.

export interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
  isStop?: boolean;
  stopDurationMinutes?: number;
}

export interface RoutePathDefinition {
  routeId: string;
  waypoints: Waypoint[];
  totalDistanceKm: number;
  averageSpeedKmh: number;
}

export interface SimulatedBusState {
  busId: string;
  routeId: string;
  tripId: string | null;
  position: { lat: number; lng: number };
  heading: number;
  speed: number;
  progress: number;
  status: 'scheduled' | 'in_transit' | 'on_time' | 'delayed' | 'completed' | 'idle_at_stop' | 'off_duty';
  movementStatus: 'moving' | 'idle' | 'stopped';
  deviceStatus: 'online' | 'offline';
  currentStopIndex: number;
  nextStopName: string | null;
  nextStopEta: Date | null;
  delayMinutes: number;
  passengersOnboard: number;
  lastUpdate: Date;
}

// ── Bus Fleet (derived from _temp_ data) ────────────────────────────────────

interface BusDefinition {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  capacity: number;
  type: 'standard' | 'express' | 'luxury' | 'minibus';
  operatorId: string;
  operatorName: string;
  routeId: string;
  firstDeparture: string;
  frequency: number;
  tripDurationMinutes: number;
}

export const BUS_FLEET: BusDefinition[] = TEMP_BUS_FLEET.map((b) => ({
  id: b.id,
  registrationNumber: b.registrationNumber,
  make: b.make,
  model: b.model,
  capacity: b.capacity,
  type: b.type,
  operatorId: b.operatorId,
  operatorName: b.operatorName,
  routeId: b.routeId,
  firstDeparture: '05:00',
  frequency: 60, // 1-hour loop
  tripDurationMinutes: 50,
}));

// ── Route Paths (derived from _temp_ data) ──────────────────────────────────

export const ROUTE_PATHS: RoutePathDefinition[] = TEMP_ROUTES.map((r) => ({
  routeId: r.id,
  waypoints: r.waypoints.map((w) => ({
    lat: w.lat,
    lng: w.lng,
    name: w.name,
    isStop: w.isStop,
    stopDurationMinutes: w.stopDurationMinutes,
  })),
  totalDistanceKm: r.totalDistanceKm,
  averageSpeedKmh: r.averageSpeedKmh,
}));

// ── Shared simulation instance ──────────────────────────────────────────────

const simulationService = new LocationSimulationService();

// ── Utility re-exports ──────────────────────────────────────────────────────

export const calculateDistance = tempCalculateDistance;
export const calculateHeading = tempCalculateHeading;
export const interpolatePositionOnPath = tempInterpolatePosition;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Map internal _temp_ status strings to the legacy status union.
 */
function mapStatus(
  status: TempSimulatedBusState['status']
): SimulatedBusState['status'] {
  switch (status) {
    case 'idle_at_terminus':
      return 'idle_at_stop';
    case 'in_transit':
    case 'on_time':
    case 'delayed':
    case 'off_duty':
      return status;
    default:
      return 'scheduled';
  }
}

/**
 * Convert a _temp_ SimulatedBusState to the legacy SimulatedBusState format.
 */
function convertState(state: TempSimulatedBusState): SimulatedBusState {
  return {
    busId: state.busId,
    routeId: state.routeId,
    tripId: state.tripId,
    position: state.position,
    heading: state.heading,
    speed: state.speed,
    progress: state.progress,
    status: mapStatus(state.status),
    movementStatus: state.movementStatus,
    deviceStatus: state.deviceStatus,
    currentStopIndex: state.currentStopIndex,
    nextStopName: state.nextStopName,
    nextStopEta: state.nextStopEta,
    delayMinutes: state.delayMinutes,
    passengersOnboard: state.passengersOnboard,
    lastUpdate: state.lastUpdate,
  };
}

/**
 * Get all simulated bus states at the current moment.
 */
export function getAllSimulatedBusStates(now: Date = new Date()): SimulatedBusState[] {
  return simulationService.getAllBusStates(now).map(convertState);
}

/**
 * Get route path definition by route ID.
 */
export function getRoutePath(routeId: string): RoutePathDefinition | undefined {
  return ROUTE_PATHS.find((r) => r.routeId === routeId);
}

/**
 * Get a bus definition by ID.
 */
export function getBusDefinition(busId: string): BusDefinition | undefined {
  return BUS_FLEET.find((b) => b.id === busId);
}

/**
 * Generate simulated state for a single bus.
 */
export function simulateBusState(busDef: BusDefinition, now: Date = new Date()): SimulatedBusState {
  const state = simulationService.getBusState(busDef.id, now);
  if (!state) {
    // Bus not found, return default idle state
    const routePath = ROUTE_PATHS.find((r) => r.routeId === busDef.routeId);
    const defaultPos = routePath ? routePath.waypoints[0] : { lat: 6.9271, lng: 79.8612 };
    return {
      busId: busDef.id,
      routeId: busDef.routeId,
      tripId: null,
      position: { lat: defaultPos.lat, lng: defaultPos.lng },
      heading: 0,
      speed: 0,
      progress: 0,
      status: 'scheduled',
      movementStatus: 'stopped',
      deviceStatus: 'online',
      currentStopIndex: 0,
      nextStopName: null,
      nextStopEta: null,
      delayMinutes: 0,
      passengersOnboard: 0,
      lastUpdate: now,
    };
  }
  return convertState(state);
}

// ── Parse time utility (for backward compat) ────────────────────────────────

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentMinutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function getCurrentTripForBus(
  bus: BusDefinition,
  currentMinutes: number
): {
  tripIndex: number;
  tripId: string;
  direction: 'forward' | 'reverse';
  departureMinutes: number;
  arrivalMinutes: number;
  tripProgress: number;
  isOnTrip: boolean;
  isAtTerminus: boolean;
  terminusWaitProgress: number;
} | null {
  // Delegate to the _temp_ simulation for the current state
  const now = new Date();
  const rawState = simulationService.getBusState(bus.id, now);
  if (!rawState) return null;

  const mapped = convertState(rawState);
  if (mapped.status === 'off_duty' || mapped.status === 'scheduled') return null;

  return {
    tripIndex: 0,
    tripId: mapped.tripId || `trip-${bus.id}-0-forward`,
    direction: 'forward',
    departureMinutes: currentMinutes - Math.floor(mapped.progress / 100 * bus.tripDurationMinutes),
    arrivalMinutes: currentMinutes + Math.floor((100 - mapped.progress) / 100 * bus.tripDurationMinutes),
    tripProgress: mapped.progress / 100,
    isOnTrip: mapped.status !== 'idle_at_stop',
    isAtTerminus: mapped.status === 'idle_at_stop' && mapped.progress >= 100,
    terminusWaitProgress: mapped.status === 'idle_at_stop' ? 0.5 : 0,
  };
}