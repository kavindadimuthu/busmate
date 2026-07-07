// =============================================================================
// Mock Location Tracking — Core Types
// =============================================================================
// Shared type definitions for the mock GPS simulation data layer.
// These types mirror the payload a real GPS tracking device would emit,
// plus internal types used by the simulation engine.

/**
 * GPS payload emitted by a tracking device (or simulated equivalent).
 * This matches the format a real GPS device would send to the backend.
 */
export interface GPSPayload {
    /** Unique identifier for the GPS device hardware */
    deviceId: string;
    /** Identifier of the bus this device is installed on */
    busId: string;
    /** Active trip identifier, null if not currently on a trip */
    tripId: string | null;
    /** ISO-8601 timestamp of the reading */
    timestamp: string;
    /** Latitude in decimal degrees */
    latitude: number;
    /** Longitude in decimal degrees */
    longitude: number;
    /** Current speed in km/h */
    speed: number;
    /** Compass heading in degrees (0–360, 0 = North) */
    heading: number;
    /** Engine ignition status */
    engineStatus: 'ON' | 'OFF';
}

// ── Route & Stop Definitions ────────────────────────────────────────────────

/**
 * A single waypoint along a route's polyline geometry.
 * Waypoints that are also stops include additional metadata.
 */
export interface Waypoint {
    lat: number;
    lng: number;
    /** Human-readable name (only for stops or notable landmarks) */
    name?: string;
    /** Whether this waypoint is an official stop */
    isStop?: boolean;
    /** Dwell time at this stop in minutes */
    stopDurationMinutes?: number;
}

/**
 * Complete route definition including polyline geometry.
 */
export interface RouteDefinition {
    id: string;
    name: string;
    shortName: string;
    /** Ordered waypoints forming the route polyline */
    waypoints: Waypoint[];
    /** Total route distance in km */
    totalDistanceKm: number;
    /** Average operating speed in km/h */
    averageSpeedKmh: number;
}

// ── Bus Definitions ─────────────────────────────────────────────────────────

/**
 * Static bus fleet entry — does not change during simulation.
 */
export interface BusDefinition {
    id: string;
    deviceId: string;
    registrationNumber: string;
    make: string;
    model: string;
    capacity: number;
    type: 'standard' | 'express' | 'luxury' | 'minibus';
    operatorId: string;
    operatorName: string;
    /** Route this bus operates on */
    routeId: string;
}

// ── Schedule Definitions ────────────────────────────────────────────────────

/**
 * A trip within the 1-hour repeating schedule window.
 * All times are relative minutes within the hour (0–59).
 */
export interface TripSchedule {
    tripId: string;
    busId: string;
    routeId: string;
    /** Departure minute within the hour (0–59) */
    departureMinute: number;
    /** Estimated trip duration in minutes */
    durationMinutes: number;
    /** Direction of travel */
    direction: 'forward' | 'reverse';
}

/**
 * Complete schedule for a single bus within the 1-hour window.
 */
export interface BusScheduleDefinition {
    busId: string;
    /** Ordered list of trips within the 1-hour window */
    trips: TripSchedule[];
}

// ── Simulation State ────────────────────────────────────────────────────────

export type BusStatus =
    | 'in_transit'
    | 'on_time'
    | 'delayed'
    | 'idle_at_stop'
    | 'idle_at_terminus'
    | 'off_duty';

export type MovementStatus = 'moving' | 'idle' | 'stopped';
export type DeviceStatus = 'online' | 'offline';

/**
 * Full simulated state for a bus at a given moment.
 * This is the internal representation used by the simulation engine.
 */
export interface SimulatedBusState {
    busId: string;
    routeId: string;
    tripId: string | null;
    position: { lat: number; lng: number };
    heading: number;
    speed: number;
    /** Trip progress 0–100 */
    progress: number;
    status: BusStatus;
    movementStatus: MovementStatus;
    deviceStatus: DeviceStatus;
    engineStatus: 'ON' | 'OFF';
    currentStopIndex: number;
    nextStopName: string | null;
    nextStopEta: Date | null;
    delayMinutes: number;
    passengersOnboard: number;
    lastUpdate: Date;
}
