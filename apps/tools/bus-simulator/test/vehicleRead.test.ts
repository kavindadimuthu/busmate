import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { GatewayClient, HttpError } from '../src/server/gateway.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function respond(status: number, body: string, contentType = 'application/json'): void {
  globalThis.fetch = (async () => new Response(body, { status, headers: { 'Content-Type': contentType } })) as typeof fetch;
}

const gateway = new GatewayClient('http://gateway.test');
const BUS = '00000000-0000-0000-0000-000000010301';

describe('INC-026 reading the platform through the gateway', () => {
  it("INC-026: the service's own NOT_FOUND means the bus has no state yet", async () => {
    respond(404, JSON.stringify({ error: { code: 'NOT_FOUND', message: 'No vehicle state for bus' } }));
    assert.deepEqual(await gateway.getVehicleState('t', BUS), { status: 'none' });
  });

  it('INC-026: a 404 that is not the service — a route the gateway does not have — is an error, never "waiting"', async () => {
    respond(404, '<pre>Cannot GET /api/vehicles/x/state</pre>', 'text/html');
    await assert.rejects(gateway.getVehicleState('t', BUS), (e: unknown) => e instanceof HttpError && e.status === 404 && /read path not found/.test(e.message));
    respond(404, JSON.stringify({ error: { code: 'SOMETHING_ELSE' } }));
    await assert.rejects(gateway.getVehicleState('t', BUS), /read path not found/);
    respond(404, '');
    await assert.rejects(gateway.getVehicleState('t', BUS), /read path not found/);
  });

  it('INC-026: a refused session and a server error surface with their status, so the poller can tell them apart', async () => {
    respond(401, '{}');
    await assert.rejects(gateway.getVehicleState('t', BUS), (e: unknown) => e instanceof HttpError && e.status === 401);
    respond(502, '{}');
    await assert.rejects(gateway.getVehicleState('t', BUS), (e: unknown) => e instanceof HttpError && e.status === 502);
  });

  it('INC-026: a snapshot is read as the platform stores it, accepting ISO and epoch-second instants', async () => {
    respond(200, JSON.stringify({
      busId: BUS, operatorId: 'op-1', deviceTimestamp: '2026-09-19T10:00:00Z', ingestedAt: 1789815601.5,
      snapshot: { ignition: true, fuel: { levelPct: 61.5 }, tyres: [{ position: 'FL', pressureKpa: 790 }] },
      activeAlerts: [{ code: 'TYRE_PRESSURE_LOW', component: 'RRO', severity: 'warning', message: 'Tyre RRO under-inflated', raisedAt: '2026-09-19T09:59:00Z' }],
    }));
    const result = await gateway.getVehicleState('t', BUS);
    assert.equal(result.status, 'ok');
    if (result.status !== 'ok') return;
    assert.equal(result.data.operatorId, 'op-1');
    assert.equal(result.data.deviceTimestamp, '2026-09-19T10:00:00Z');
    assert.equal(result.data.ingestedAt, new Date(1789815601.5 * 1000).toISOString());
    assert.equal(result.data.snapshot.fuel?.levelPct, 61.5);
    assert.deepEqual(result.data.activeAlerts, [{ code: 'TYRE_PRESSURE_LOW', component: 'RRO', severity: 'warning', message: 'Tyre RRO under-inflated', raisedAt: '2026-09-19T09:59:00Z' }]);
  });

  it('INC-026: an alert with no component is read with a null component', async () => {
    respond(200, JSON.stringify({ snapshot: {}, activeAlerts: [{ code: 'LOW_FUEL', severity: 'warning', raisedAt: '2026-09-19T09:59:00Z' }] }));
    const result = await gateway.getVehicleState('t', BUS);
    assert.ok(result.status === 'ok' && result.data.activeAlerts[0].component === null);
  });

  it('INC-026: the request carries the staff token and asks for the right bus', async () => {
    let seen: { url: string; auth: string | null } | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen = { url: String(input), auth: new Headers(init?.headers).get('Authorization') };
      return new Response('{"snapshot":{},"activeAlerts":[]}', { status: 200 });
    }) as typeof fetch;
    await gateway.getVehicleState('secret-token', BUS);
    assert.equal(seen?.url, `http://gateway.test/api/vehicles/${BUS}/state`);
    assert.equal(seen?.auth, 'Bearer secret-token');
  });
});
