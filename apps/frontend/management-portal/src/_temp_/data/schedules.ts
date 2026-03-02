// =============================================================================
// Mock Location Tracking — Schedule Definitions
// =============================================================================
// Trip schedules relative to a 1-hour repeating window.
//
// How the 1-hour loop works:
//   - The simulation maps the current clock time to a minute within
//     a 60-minute window using (currentMinutes % 60).
//   - Within that window, each bus has a forward trip and optionally
//     idle/terminus time before the window resets.
//   - This creates a seamless loop: every hour, buses replay the
//     same journey, making the demo easy to observe at any time.

import type { BusScheduleDefinition } from './types';

/**
 * Schedule definitions for the mock bus fleet.
 *
 * Layout within the 60-minute window:
 *
 * Bus 1 (Colombo-Kandy Express, ~115 km):
 *   - Forward: departs min  0, duration 50 min → arrives min 50
 *   - Idle at terminus: min 50–55 (5 min dwell)
 *   - Repositioning implied by loop reset at min 60
 *
 * Bus 2 (Colombo-Galle Highway, ~126 km):
 *   - Forward: departs min  5, duration 45 min → arrives min 50
 *   - Idle at terminus: min 50–55 (5 min dwell)
 *   - Repositioning implied by loop reset at min 60
 */
export const BUS_SCHEDULES: BusScheduleDefinition[] = [
    {
        busId: 'bus-001',
        trips: [
            {
                tripId: 'trip-001-fwd',
                busId: 'bus-001',
                routeId: 'route-001',
                departureMinute: 0,
                durationMinutes: 50,
                direction: 'forward',
            },
        ],
    },
    {
        busId: 'bus-002',
        trips: [
            {
                tripId: 'trip-002-fwd',
                busId: 'bus-002',
                routeId: 'route-002',
                departureMinute: 5,
                durationMinutes: 45,
                direction: 'forward',
            },
        ],
    },
];

/**
 * Get the schedule for a specific bus.
 */
export function getScheduleForBus(busId: string): BusScheduleDefinition | undefined {
    return BUS_SCHEDULES.find((s) => s.busId === busId);
}
