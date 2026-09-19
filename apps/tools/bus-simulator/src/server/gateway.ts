import { fromCoreServiceRoute, type CoreServiceRoute, type SimRoute } from '../core/route.ts';
import type { PlatformVehicleData, RouteSummary } from '../shared/protocol.ts';

const TIMEOUT_MS = 8_000;

/** The one thing a publisher needs from the gateway; lets tests supply a stand-in. */
export interface IngestGateway {
  ingest(eventType: IngestEventType, token: string, body: unknown): Promise<IngestResult>;
}

export type IngestEventType = 'location' | 'device-status' | 'vehicle-telemetry' | 'alert';

/** Every call goes through api-gateway, as a real device's would; nothing here holds a service URL. */
export class GatewayClient implements IngestGateway {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async listRoutes(): Promise<RouteSummary[]> {
    const routes = await this.getJson<Array<CoreServiceRoute & { routeNumber?: string | null }>>('/api/routes/all');
    return routes
      .map((r) => ({
        id: r.id,
        name: r.name,
        routeNumber: r.routeNumber ?? null,
        roadType: r.roadType ?? 'NORMALWAY',
        locatedStops: fromCoreServiceRoute(r).stops.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getRoute(routeId: string): Promise<SimRoute> {
    return fromCoreServiceRoute(await this.getJson<CoreServiceRoute>(`/api/routes/${encodeURIComponent(routeId)}`));
  }

  /** Staff sign-in, used only to watch the live stream the way the MOT portal does. */
  async login(email: string, password: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new HttpError(res.status, `login refused (${res.status})`);
    const body = (await res.json()) as { accessToken?: string };
    if (!body.accessToken) throw new Error('login response carried no access token');
    return body.accessToken;
  }

  /**
   * The vehicle health the platform holds for a bus (INC-024's read path), read as the staff caller the
   * token belongs to. `none` when the platform has no state for that bus yet — or, indistinguishably,
   * when the caller may not see it. Anything else unexpected throws, so the caller can tell a refused
   * session (401/403) from an outage.
   */
  async getVehicleState(token: string, busId: string): Promise<VehicleStateResult> {
    const res = await fetch(`${this.baseUrl}/api/vehicles/${encodeURIComponent(busId)}/state`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) {
      // Only the service's own answer means "no state for this bus". Any other 404 — the gateway's
      // "Cannot GET" page, a route that is not registered — means the read path itself is missing,
      // and must not be dressed up as a calm "waiting".
      const text = await res.text();
      let code: unknown;
      try {
        code = (JSON.parse(text) as { error?: { code?: unknown } }).error?.code;
      } catch {
        code = undefined;
      }
      if (code === 'NOT_FOUND') return { status: 'none' };
      throw new HttpError(404, 'vehicle read path not found (404) — is the gateway route /api/vehicles registered and telemetry-service up to date?');
    }
    if (!res.ok) throw new HttpError(res.status, `vehicle state read refused (${res.status})`);
    const body = (await res.json()) as {
      operatorId?: string | null;
      deviceTimestamp?: string | number | null;
      ingestedAt?: string | number | null;
      snapshot?: PlatformVehicleData['snapshot'];
      activeAlerts?: PlatformVehicleData['activeAlerts'];
    };
    return {
      status: 'ok',
      data: {
        operatorId: body.operatorId ?? null,
        deviceTimestamp: toIso(body.deviceTimestamp),
        ingestedAt: toIso(body.ingestedAt),
        snapshot: body.snapshot ?? {},
        activeAlerts: (body.activeAlerts ?? []).map((a) => ({
          code: a.code,
          component: a.component ?? null,
          severity: a.severity,
          message: a.message ?? null,
          raisedAt: toIso(a.raisedAt as unknown as string | number | null),
        })),
        receivedAt: new Date().toISOString(),
      },
    };
  }

  /** Posts one event to the device ingest endpoint with the device's own bearer token. */
  async ingest(eventType: IngestEventType, token: string, body: unknown): Promise<IngestResult> {
    const res = await fetch(`${this.baseUrl}/ingest/v1/${eventType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, `ingest ${eventType} refused (${res.status}): ${text.slice(0, 200)}`);
    const parsed = text ? (JSON.parse(text) as { status?: string; reason?: string | null }) : {};
    return { status: parsed.status === 'flagged' ? 'flagged' : 'accepted', reason: parsed.reason ?? null };
  }

  private async getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new HttpError(res.status, `GET ${path} failed (${res.status})`);
    return (await res.json()) as T;
  }
}

export type VehicleStateResult = { status: 'none' } | { status: 'ok'; data: PlatformVehicleData };

/** Instants arrive as ISO strings from REST but as epoch seconds on the Kafka-fed stream; accept both. */
export function toIso(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : value;
}

export interface IngestResult {
  status: 'accepted' | 'flagged';
  reason: string | null;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
