// =============================================================================
// Mock Location Tracking — Bus Fleet Definitions
// =============================================================================
// 2 buses assigned to the 2 routes. Easily extensible by adding entries.

import type { BusDefinition } from './types';

/**
 * Mock bus fleet.
 * Each bus is bound to a single route and carries a unique deviceId
 * that the GPS payload references.
 */
export const BUS_FLEET: BusDefinition[] = [
    {
        id: 'bus-001',
        deviceId: 'GPS-DEV-001',
        registrationNumber: 'WP CAB-1234',
        make: 'Leyland',
        model: 'Viking',
        capacity: 52,
        type: 'express',
        operatorId: 'op-001',
        operatorName: 'Lanka Ashok Leyland',
        routeId: 'route-001',
    },
    {
        id: 'bus-002',
        deviceId: 'GPS-DEV-002',
        registrationNumber: 'WP GLE-2222',
        make: 'Volvo',
        model: 'B9R',
        capacity: 45,
        type: 'luxury',
        operatorId: 'op-002',
        operatorName: 'Highway Kings',
        routeId: 'route-002',
    },
];

/**
 * Look up a bus definition by its ID.
 */
export function getBusById(busId: string): BusDefinition | undefined {
    return BUS_FLEET.find((b) => b.id === busId);
}

/**
 * Look up a bus definition by its deviceId.
 */
export function getBusByDeviceId(deviceId: string): BusDefinition | undefined {
    return BUS_FLEET.find((b) => b.deviceId === deviceId);
}
