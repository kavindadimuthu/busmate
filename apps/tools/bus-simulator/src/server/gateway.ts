import { fromCoreServiceRoute, type CoreServiceRoute, type SimRoute } from '../core/route.ts';
import type { RouteSummary } from '../shared/protocol.ts';

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
