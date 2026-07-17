// Client for api-gateway's live-tracking SSE stream (IoT Platform Layer plan, Phase 3):
// GET /live/stream, which pushes bus-position and device-status updates consumed from Kafka.
//
// Not the native `EventSource` API: this portal authenticates every call with a short-lived
// bearer token (see lib/api/setup.ts's fetchAccessToken), and `EventSource` cannot set custom
// request headers — only cookies/URL params, neither of which this app's auth model uses.
// `fetch` + a streamed `ReadableStream` reader gets the same effect (a long-lived
// `text/event-stream` connection) while still sending `Authorization: Bearer <token>`.
import { fetchAccessToken } from '@/lib/api/setup';
import { getGatewayUrl } from '@/lib/auth/session';

const gatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || getGatewayUrl();
const RECONNECT_DELAY_MS = 5_000;

export interface LiveBusPosition {
  busId: string;
  deviceId: string | null;
  tripId: string | null;
  lat: number;
  lng: number;
  speedKmh: number | null;
  headingDeg: number | null;
  deviceTimestamp: string | null;
  ingestedAt: string;
}

export interface LiveDeviceStatus {
  deviceId: string;
  status: string;
  ingestedAt: string;
  payload: unknown;
}

interface LiveTrackingHandlers {
  onSnapshot?: (snapshot: { buses: LiveBusPosition[]; devices: LiveDeviceStatus[] }) => void;
  onBusPosition?: (position: LiveBusPosition) => void;
  onDeviceStatus?: (status: LiveDeviceStatus) => void;
}

/**
 * Subscribes to the live-tracking stream. Reconnects automatically on any drop (network blip,
 * gateway restart) — the stream itself is best-effort and the caller's UI should treat "no live
 * data yet" as a normal, expected state (falls back to schedule/simulation data), not an error.
 * Returns an unsubscribe function; call it on component unmount.
 */
export function subscribeLiveTracking(handlers: LiveTrackingHandlers): () => void {
  const controller = new AbortController();
  let stopped = false;

  async function connectLoop() {
    while (!stopped) {
      try {
        await connectOnce(controller.signal, handlers);
      } catch {
        // Connection dropped or never opened — fall through to the retry delay below.
      }
      if (stopped) return;
      await sleep(RECONNECT_DELAY_MS);
    }
  }

  void connectLoop();

  return () => {
    stopped = true;
    controller.abort();
  };
}

async function connectOnce(signal: AbortSignal, handlers: LiveTrackingHandlers): Promise<void> {
  const token = await fetchAccessToken();
  const res = await fetch(`${gatewayBaseUrl}/live/stream`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Live stream connection failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatch(rawEvent, handlers);
      boundary = buffer.indexOf('\n\n');
    }
  }
}

function dispatch(rawEvent: string, handlers: LiveTrackingHandlers): void {
  let eventName = 'message';
  let data = '';
  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return;

  try {
    const parsed = JSON.parse(data);
    if (eventName === 'snapshot') handlers.onSnapshot?.(parsed);
    else if (eventName === 'bus-position') handlers.onBusPosition?.(parsed);
    else if (eventName === 'device-status') handlers.onDeviceStatus?.(parsed);
  } catch {
    // Malformed frame (shouldn't happen — the gateway only ever JSON.stringifies its own state) —
    // skip it rather than tearing down the whole connection over one bad message.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
