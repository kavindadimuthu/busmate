// =============================================================================
// Mock Location Tracking — Bus Fleet Definitions
// =============================================================================
// 2 buses assigned to the 2 routes. Easily extensible by adding entries.
//
// IDs are the real demo bus UUIDs from docs/dev-seed-contract.md (Phase 3, IoT Platform Layer
// plan) — the same buses core-service's dev seed defines and telemetry-service's dev seed
// assigns a real GPS_TRACKER device to. This is what lets the tracking page's live overlay
// (useLiveBusPositions, matched by busId) show a real position the moment the device simulator
// (tools/device-simulator, `pnpm simulate:device`) is posting fixes for that bus — otherwise this
// simulation-generated position stands in, so the page always renders something.

import type { BusDefinition } from './types';

export const BUS_FLEET: BusDefinition[] = [
    {
        id: '00000000-0000-0000-0000-000000010301',
        deviceId: 'GPS-DEMO-4521',
        registrationNumber: 'WP CAA-4521',
        make: 'TATA',
        model: 'LP 1613',
        capacity: 52,
        type: 'express',
        operatorId: 'op-001',
        operatorName: 'Lanka Suwaseriya Travels (Pvt) Ltd',
        routeId: 'route-001',
    },
    {
        id: '00000000-0000-0000-0000-000000010303',
        deviceId: 'GPS-DEMO-2210',
        registrationNumber: 'SP CAA-2210',
        make: 'Rosa',
        model: 'Coaster',
        capacity: 45,
        type: 'luxury',
        operatorId: 'op-002',
        operatorName: 'Southern Comfort Express (Pvt) Ltd',
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
