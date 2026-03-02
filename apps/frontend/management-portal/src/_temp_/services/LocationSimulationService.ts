// =============================================================================
// Mock Location Tracking — Location Simulation Service
// =============================================================================
// Core simulation engine that generates GPS payloads for each bus based on
// the current time within a 1-hour repeating window.
//
// Architecture:
//   - Stateless position calculation — given a time, deterministically
//     computes each bus's position, speed, heading, and status.
//   - Emission mode — periodically calls a callback with an array of
//     GPSPayload objects, mimicking a real device → backend → frontend flow.
//   - Designed for easy replacement with real WebSocket data in production.

import type {
    GPSPayload,
    SimulatedBusState,
    BusDefinition,
    TripSchedule,
    Waypoint,
    BusStatus,
    MovementStatus,
} from '../data/types';
import { BUS_FLEET, getBusById } from '../data/buses';
import { ROUTES, getRouteById } from '../data/routes';
import { BUS_SCHEDULES, getScheduleForBus } from '../data/schedules';
import {
    interpolatePositionOnPath,
    calculateHeading,
} from '../utils/geo';
import {
    getCurrentMinuteInHour,
    getDailyRandomFactor,
} from '../utils/time';

// ── Trip Position Calculator ────────────────────────────────────────────────

interface TripPosition {
    isOnTrip: boolean;
    isAtTerminus: boolean;
    tripId: string | null;
    direction: 'forward' | 'reverse';
    tripProgress: number; // 0–1
}

/**
 * Determine a bus's position within the 1-hour schedule window.
 *
 * The schedule layout per bus:
 *   [departure ... departure + duration] = forward trip
 *   [departure + duration ... departure + duration + 5] = terminus dwell
 *   [rest of hour] = idle / repositioning (bus shown at start depot)
 */
function getTripPosition(
    schedule: TripSchedule,
    minuteInHour: number
): TripPosition {
    const TERMINUS_DWELL = 5; // minutes at terminus

    const dep = schedule.departureMinute;
    const dur = schedule.durationMinutes;
    const arrivalMinute = dep + dur;
    const terminusEnd = arrivalMinute + TERMINUS_DWELL;

    // Wrap minuteInHour for cases where it might exceed 60
    const m = ((minuteInHour % 60) + 60) % 60;

    // Before departure → idle at depot
    if (m < dep) {
        return {
            isOnTrip: false,
            isAtTerminus: false,
            tripId: null,
            direction: 'forward',
            tripProgress: 0,
        };
    }

    // During forward trip
    if (m < arrivalMinute) {
        const progress = (m - dep) / dur;
        return {
            isOnTrip: true,
            isAtTerminus: false,
            tripId: schedule.tripId,
            direction: schedule.direction,
            tripProgress: Math.max(0, Math.min(1, progress)),
        };
    }

    // At terminus (dwell)
    if (m < terminusEnd) {
        return {
            isOnTrip: false,
            isAtTerminus: true,
            tripId: schedule.tripId,
            direction: schedule.direction,
            tripProgress: 1,
        };
    }

    // After terminus until hour resets → idle at terminus/repositioning
    return {
        isOnTrip: false,
        isAtTerminus: false,
        tripId: null,
        direction: 'forward',
        tripProgress: 0,
    };
}

// ── State Calculator ────────────────────────────────────────────────────────

/**
 * Calculate full simulated state for one bus at a given moment.
 */
function calculateBusState(
    busDef: BusDefinition,
    now: Date
): SimulatedBusState {
    const minuteInHour = getCurrentMinuteInHour(now);
    const schedule = getScheduleForBus(busDef.id);
    const route = getRouteById(busDef.routeId);

    // Default depot position
    const depotPosition = route
        ? { lat: route.waypoints[0].lat, lng: route.waypoints[0].lng }
        : { lat: 6.9271, lng: 79.8612 };

    // No schedule or route — off duty
    if (!schedule || !route) {
        return createIdleState(busDef, depotPosition, now);
    }

    // Currently only one trip per schedule; pick the first
    const trip = schedule.trips[0];
    if (!trip) {
        return createIdleState(busDef, depotPosition, now);
    }

    const tripPos = getTripPosition(trip, minuteInHour);

    // Deterministic daily variation for this bus
    const dailyDelay = getDailyRandomFactor(busDef.id, 'delay');
    const dailyPassengers = getDailyRandomFactor(busDef.id, 'passengers');

    // ── Idle / off-duty states ───────────────────────────────────────────
    if (!tripPos.isOnTrip && !tripPos.isAtTerminus) {
        return createIdleState(busDef, depotPosition, now);
    }

    // ── At terminus ──────────────────────────────────────────────────────
    if (tripPos.isAtTerminus) {
        const lastWaypoint = route.waypoints[route.waypoints.length - 1];
        return {
            busId: busDef.id,
            routeId: busDef.routeId,
            tripId: tripPos.tripId,
            position: { lat: lastWaypoint.lat, lng: lastWaypoint.lng },
            heading: 0,
            speed: 0,
            progress: 100,
            status: 'idle_at_terminus',
            movementStatus: 'idle',
            deviceStatus: 'online',
            engineStatus: 'ON',
            currentStopIndex: route.waypoints.length - 1,
            nextStopName: null,
            nextStopEta: null,
            delayMinutes: 0,
            passengersOnboard: Math.floor(busDef.capacity * 0.1 * dailyPassengers),
            lastUpdate: now,
        };
    }

    // ── On trip — calculate position ─────────────────────────────────────
    let waypoints: Waypoint[] = [...route.waypoints];
    if (tripPos.direction === 'reverse') {
        waypoints = [...waypoints].reverse();
    }

    // Apply small delay based on daily factor
    const delayMinutes = Math.floor(dailyDelay * 8);
    const effectiveProgress = Math.max(
        0,
        tripPos.tripProgress - (delayMinutes / trip.durationMinutes) * 0.3
    );

    const posInfo = interpolatePositionOnPath(waypoints, effectiveProgress);

    // GPS jitter for realism
    const jitterLat = (Math.random() - 0.5) * 0.0002;
    const jitterLng = (Math.random() - 0.5) * 0.0002;

    // Determine if at a stop
    const currentWp = waypoints[posInfo.currentWaypointIndex];
    const isAtStop =
        currentWp?.isStop &&
        Math.abs(
            effectiveProgress -
            posInfo.currentWaypointIndex / (waypoints.length - 1)
        ) < 0.02;

    // Speed calculation
    let speed = 0;
    if (!isAtStop) {
        const baseSpeed = route.averageSpeedKmh;
        const variation = 0.8 + Math.random() * 0.4;
        speed = Math.round(baseSpeed * variation);
    }

    // Status
    let status: BusStatus;
    let movementStatus: MovementStatus;

    if (isAtStop) {
        status = delayMinutes > 3 ? 'delayed' : 'on_time';
        movementStatus = 'idle';
        speed = 0;
    } else {
        status = delayMinutes > 3 ? 'delayed' : 'in_transit';
        movementStatus = speed > 5 ? 'moving' : 'idle';
    }

    // Next stop
    let nextStopName: string | null = null;
    let nextStopEta: Date | null = null;
    for (let i = posInfo.currentWaypointIndex + 1; i < waypoints.length; i++) {
        if (waypoints[i].isStop) {
            nextStopName = waypoints[i].name || `Stop ${i}`;
            const remainingProgress = i / (waypoints.length - 1) - effectiveProgress;
            const remainingMinutes = remainingProgress * trip.durationMinutes;
            nextStopEta = new Date(now.getTime() + remainingMinutes * 60 * 1000);
            break;
        }
    }

    // Passengers
    const peakFactor =
        effectiveProgress < 0.5
            ? effectiveProgress * 2
            : 2 - effectiveProgress * 2;
    const passengersOnboard = Math.floor(
        busDef.capacity * 0.6 * (0.3 + peakFactor * 0.7) * (0.8 + dailyPassengers * 0.4)
    );

    return {
        busId: busDef.id,
        routeId: busDef.routeId,
        tripId: tripPos.tripId,
        position: {
            lat: posInfo.position.lat + jitterLat,
            lng: posInfo.position.lng + jitterLng,
        },
        heading: posInfo.heading,
        speed,
        progress: Math.round(effectiveProgress * 100),
        status,
        movementStatus,
        deviceStatus: 'online',
        engineStatus: 'ON',
        currentStopIndex: posInfo.currentWaypointIndex,
        nextStopName,
        nextStopEta,
        delayMinutes,
        passengersOnboard,
        lastUpdate: now,
    };
}

/**
 * Create an idle/off-duty state for a bus at a given position.
 */
function createIdleState(
    busDef: BusDefinition,
    position: { lat: number; lng: number },
    now: Date
): SimulatedBusState {
    return {
        busId: busDef.id,
        routeId: busDef.routeId,
        tripId: null,
        position,
        heading: 0,
        speed: 0,
        progress: 0,
        status: 'off_duty',
        movementStatus: 'stopped',
        deviceStatus: 'online',
        engineStatus: 'OFF',
        currentStopIndex: 0,
        nextStopName: null,
        nextStopEta: null,
        delayMinutes: 0,
        passengersOnboard: 0,
        lastUpdate: now,
    };
}

// ── GPS Payload Converter ───────────────────────────────────────────────────

/**
 * Convert a SimulatedBusState to a GPSPayload (the format a real device emits).
 */
function stateToGPSPayload(
    state: SimulatedBusState,
    busDef: BusDefinition
): GPSPayload {
    return {
        deviceId: busDef.deviceId,
        busId: state.busId,
        tripId: state.tripId,
        timestamp: state.lastUpdate.toISOString(),
        latitude: state.position.lat,
        longitude: state.position.lng,
        speed: state.speed,
        heading: Math.round(state.heading),
        engineStatus: state.engineStatus,
    };
}

// ── Public Service Class ────────────────────────────────────────────────────

/**
 * LocationSimulationService
 *
 * Provides two modes of operation:
 * 1. **Snapshot** — call `getAllBusStates()` or `getBusState(id)` for
 *    an instant snapshot of all bus positions at the current moment.
 * 2. **Streaming** — call `start(callback, interval)` to periodically
 *    receive GPSPayload arrays, mimicking a real GPS data stream.
 *
 * @example
 * ```ts
 * const sim = new LocationSimulationService();
 *
 * // Snapshot mode
 * const states = sim.getAllBusStates();
 *
 * // Streaming mode (every 5 seconds)
 * sim.start((payloads) => {
 *   console.log('GPS update:', payloads);
 * }, 5000);
 *
 * // Later...
 * sim.stop();
 * ```
 */
export class LocationSimulationService {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private isRunning = false;

    /**
     * Start emitting GPS payloads at the given interval.
     *
     * @param onUpdate  Callback invoked with an array of GPSPayload objects
     * @param intervalMs Emission interval in milliseconds (default: 5000)
     */
    start(
        onUpdate: (payloads: GPSPayload[]) => void,
        intervalMs: number = 5000
    ): void {
        if (this.isRunning) {
            this.stop();
        }

        this.isRunning = true;

        // Emit immediately on start
        onUpdate(this.getAllGPSPayloads());

        // Then emit at regular intervals
        this.intervalId = setInterval(() => {
            onUpdate(this.getAllGPSPayloads());
        }, intervalMs);
    }

    /**
     * Stop the GPS emission loop.
     */
    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    /**
     * Whether the service is currently emitting payloads.
     */
    get running(): boolean {
        return this.isRunning;
    }

    /**
     * Get a snapshot of all bus states at the current moment.
     */
    getAllBusStates(now: Date = new Date()): SimulatedBusState[] {
        return BUS_FLEET.map((bus) => calculateBusState(bus, now));
    }

    /**
     * Get a snapshot of a single bus's state.
     */
    getBusState(busId: string, now: Date = new Date()): SimulatedBusState | null {
        const busDef = getBusById(busId);
        if (!busDef) return null;
        return calculateBusState(busDef, now);
    }

    /**
     * Get GPS payloads for all buses at the current moment.
     */
    getAllGPSPayloads(now: Date = new Date()): GPSPayload[] {
        return BUS_FLEET.map((busDef) => {
            const state = calculateBusState(busDef, now);
            return stateToGPSPayload(state, busDef);
        });
    }

    /**
     * Get a GPS payload for a single bus.
     */
    getGPSPayload(busId: string, now: Date = new Date()): GPSPayload | null {
        const busDef = getBusById(busId);
        if (!busDef) return null;
        const state = calculateBusState(busDef, now);
        return stateToGPSPayload(state, busDef);
    }
}
