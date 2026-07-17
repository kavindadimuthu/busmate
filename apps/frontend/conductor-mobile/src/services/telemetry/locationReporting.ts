import * as Location from 'expo-location';
import { API_GATEWAY_URL } from '@/config/apiConfig';

// GPS reporting while a trip is active (IoT Platform Layer plan, Phase 2) — the conductor app is
// the platform's first production "device". expo-location was already a dependency and its
// permission plugin already configured (app.json); this module is the wiring: watchPositionAsync
// while a trip is ongoing, POSTing each fix to the ingest endpoint.
//
// Device provisioning is a known simplification for now: this uses one shared, dev-seeded
// CONDUCTOR_APP device credential (see docs/dev-iot-device-credentials.md) rather than a
// per-conductor self-service registration flow. Every conductor's phone reports as the same
// device, distinguished only by whichever tripId it's currently sending — fine for proving the
// pipeline end to end, but a real rollout needs each phone provisioned as its own device (a
// natural Phase 4 hardening item, alongside the hardware-tracker rollout that phase already covers).
const DEVICE_TOKEN =
  process.env.EXPO_PUBLIC_CONDUCTOR_DEVICE_TOKEN || 'bmt_devseed_07_e04d83705b012955cb56e8f5';

// Coarse interval — this is a phone in someone's pocket for a whole shift, not a dedicated
// tracker; battery cost matters more than second-by-second precision. 20m distance filter avoids
// spamming fixes while stopped in traffic/at a stand.
const TIME_INTERVAL_MS = 15_000;
const DISTANCE_INTERVAL_M = 20;

let watchSubscription: Location.LocationSubscription | null = null;
let sequenceNo = 0;

async function postFix(tripId: string, location: Location.LocationObject): Promise<void> {
  const { latitude, longitude, speed, heading, accuracy } = location.coords;

  const body = {
    deviceTimestamp: new Date(location.timestamp).toISOString(),
    sequenceNo: sequenceNo++,
    tripId,
    payload: {
      lat: latitude,
      lng: longitude,
      // expo-location reports speed in m/s and accuracy/heading as null when unavailable —
      // the ingest payload schema expects km/h and omits fields the device didn't report.
      ...(speed != null && speed >= 0 ? { speedKmh: speed * 3.6 } : {}),
      ...(heading != null && heading >= 0 ? { headingDeg: heading } : {}),
      ...(accuracy != null ? { accuracyM: accuracy } : {}),
    },
  };

  try {
    const res = await fetch(`${API_GATEWAY_URL}/ingest/v1/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEVICE_TOKEN}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[locationReporting] ingest rejected fix:', res.status, await res.text());
    }
  } catch (error) {
    // Best-effort: a dropped fix during a dead zone shouldn't crash the trip screen. The next
    // watchPositionAsync callback just tries again.
    console.warn('[locationReporting] failed to send fix:', error);
  }
}

/** Starts reporting GPS fixes for the given trip. No-ops if already reporting. */
export async function startReporting(tripId: string): Promise<void> {
  if (watchSubscription) return;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[locationReporting] location permission not granted — GPS reporting disabled');
    return;
  }

  sequenceNo = 0;
  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: TIME_INTERVAL_MS,
      distanceInterval: DISTANCE_INTERVAL_M,
    },
    (location) => {
      postFix(tripId, location);
    },
  );
}

/** Stops reporting. Safe to call even if reporting was never started. */
export function stopReporting(): void {
  watchSubscription?.remove();
  watchSubscription = null;
}
