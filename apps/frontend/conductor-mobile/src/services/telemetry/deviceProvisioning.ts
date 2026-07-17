import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/apiClient';

// Per-conductor device self-provisioning (IoT Platform Layer plan, Phase 4) — closes Phase 2's
// known simplification, where every conductor-mobile install shared one hardcoded dev device
// token. On first use, this app calls telemetry-service's own self-service endpoint (through the
// gateway, authenticated with the conductor's own staff JWT — not a device token) to get a
// per-install device + ingest token, then caches it the same way tokenStore.ts caches the auth
// session (plain AsyncStorage — this codebase doesn't use expo-secure-store anywhere, including
// for the actual login session, so this matches existing practice rather than introducing a new
// storage mechanism for one value).
const DEVICE_TOKEN_KEY = 'busmate.conductor.telemetry.deviceToken';

interface DeviceRegisteredResponse {
  device: { id: string; serialNumber: string };
  token: string;
}

let inFlight: Promise<string> | null = null;

/** Returns this install's device ingest token, provisioning one on first call. */
export async function getOrProvisionDeviceToken(): Promise<string> {
  const cached = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (cached) return cached;

  // Multiple callers (e.g. two trips starting reporting near-simultaneously) must not each
  // provision/rotate a fresh token and race each other's writes to storage.
  if (!inFlight) {
    inFlight = provision().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function provision(): Promise<string> {
  const response = await apiClient.authenticatedRequest<DeviceRegisteredResponse>(
    'devices/provision-conductor',
    { method: 'POST' },
    'user',
  );
  await AsyncStorage.setItem(DEVICE_TOKEN_KEY, response.token);
  return response.token;
}

/** Clears the cached token — e.g. on logout, so a different conductor logging in on the same
 * phone doesn't keep reporting under the previous conductor's device identity. */
export async function clearDeviceToken(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
}
