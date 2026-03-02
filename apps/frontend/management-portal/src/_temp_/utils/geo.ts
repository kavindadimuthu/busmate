// =============================================================================
// Mock Location Tracking — Geographic Utilities
// =============================================================================
// Pure functions for distance, heading, and interpolation calculations.

import type { Waypoint } from '../data/types';

/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula.
 *
 * @returns Distance in kilometres.
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate the initial bearing (heading) from point A to point B.
 *
 * @returns Heading in degrees (0–360, 0 = North, 90 = East).
 */
export function calculateHeading(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
): number {
    const dLng = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const heading = toDegrees(Math.atan2(y, x));
    return (heading + 360) % 360;
}

/**
 * Linearly interpolate between two coordinate points.
 *
 * @param p1 Start point
 * @param p2 End point
 * @param t  Interpolation factor 0–1
 * @returns  Interpolated {lat, lng}
 */
export function interpolateBetweenPoints(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
    t: number
): { lat: number; lng: number } {
    const clamped = Math.max(0, Math.min(1, t));
    return {
        lat: p1.lat + (p2.lat - p1.lat) * clamped,
        lng: p1.lng + (p2.lng - p1.lng) * clamped,
    };
}

/**
 * Calculate position along an ordered array of waypoints given a
 * progress value between 0 and 1.
 *
 * The function computes cumulative segment distances, finds the
 * appropriate segment, and linearly interpolates within it.
 *
 * @param waypoints Ordered waypoints defining the polyline
 * @param progress  Value between 0 (start) and 1 (end)
 * @returns         Position, heading, and nearest waypoint index
 */
export function interpolatePositionOnPath(
    waypoints: Waypoint[],
    progress: number
): {
    position: { lat: number; lng: number };
    heading: number;
    currentWaypointIndex: number;
} {
    if (waypoints.length === 0) {
        return { position: { lat: 0, lng: 0 }, heading: 0, currentWaypointIndex: 0 };
    }

    // Clamp to boundaries
    if (progress <= 0) {
        const heading =
            waypoints.length > 1
                ? calculateHeading(waypoints[0], waypoints[1])
                : 0;
        return {
            position: { lat: waypoints[0].lat, lng: waypoints[0].lng },
            heading,
            currentWaypointIndex: 0,
        };
    }

    if (progress >= 1) {
        const last = waypoints.length - 1;
        const heading =
            waypoints.length > 1
                ? calculateHeading(waypoints[last - 1], waypoints[last])
                : 0;
        return {
            position: { lat: waypoints[last].lat, lng: waypoints[last].lng },
            heading,
            currentWaypointIndex: last,
        };
    }

    // Build cumulative distance array
    const segmentDistances: number[] = [];
    let totalDistance = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
        const d = calculateDistance(
            waypoints[i].lat,
            waypoints[i].lng,
            waypoints[i + 1].lat,
            waypoints[i + 1].lng
        );
        segmentDistances.push(d);
        totalDistance += d;
    }

    // Walk segments to find the right one
    const targetDistance = progress * totalDistance;
    let accumulated = 0;

    for (let i = 0; i < segmentDistances.length; i++) {
        const segDist = segmentDistances[i];
        if (accumulated + segDist >= targetDistance) {
            const remaining = targetDistance - accumulated;
            const segProgress = segDist > 0 ? remaining / segDist : 0;
            const position = interpolateBetweenPoints(
                waypoints[i],
                waypoints[i + 1],
                segProgress
            );
            const heading = calculateHeading(waypoints[i], waypoints[i + 1]);
            return { position, heading, currentWaypointIndex: i };
        }
        accumulated += segDist;
    }

    // Fallback — last point
    const last = waypoints.length - 1;
    return {
        position: { lat: waypoints[last].lat, lng: waypoints[last].lng },
        heading: calculateHeading(waypoints[last - 1], waypoints[last]),
        currentWaypointIndex: last,
    };
}

// ── Internal helpers ────────────────────────────────────────────────────────

function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
    return (rad * 180) / Math.PI;
}

/**
 * Decodes an encoded polyline string into an array of {lat, lng} objects.
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ lat: lat / 1E5, lng: lng / 1E5 });
    }
    return points;
}
