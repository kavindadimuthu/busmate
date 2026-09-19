import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SimRoute } from '../src/core/route.ts';
import { Simulation } from '../src/core/simulation.ts';
import type { Warning } from '../src/core/types.ts';
import { compareVehicle, STALE_AFTER_S } from '../src/shared/compareVehicle.ts';
import type { PlatformVehicleData } from '../src/shared/protocol.ts';
import { HttpError, type VehicleStateResult } from '../src/server/gateway.ts';
import { VehiclePoller, type VehicleSource } from '../src/server/vehiclePoller.ts';

const ROUTE: SimRoute = {
  id: 'r', name: 'R', roadType: 'NORMALWAY',
  stops: [
    { stopId: 'a', name: 'A', lat: 6.93, lng: 79.84 },
    { stopId: 'b', name: 'B', lat: 6.95, lng: 79.84 },
  ],
};

const NOW = Date.parse('2026-09-19T10:00:00Z');
const iso = (secondsAgo: number) => new Date(NOW - secondsAgo * 1000).toISOString();

/** A bus state holding exactly these warnings — the comparison only reads warnings, not physics. */
function busWith(...warnings: Warning[]) {
  return { ...new Simulation({ route: ROUTE, seed: 1 }).snapshot(), warnings };
}
const warning = (code: Warning['code'], tyre?: Warning['tyre']): Warning => ({ code, ...(tyre ? { tyre } : {}), message: code });

function platformWith(alerts: Array<[string, string | null]>, ageS = 2): PlatformVehicleData {
  return {
    operatorId: 'op', deviceTimestamp: iso(ageS), ingestedAt: iso(ageS), receivedAt: iso(0),
    snapshot: { fuel: { levelPct: 10 } },
    activeAlerts: alerts.map(([code, component]) => ({ code, component, severity: 'warning', message: null, raisedAt: iso(ageS) })),
  };
}

describe('INC-026 comparing the bus with the platform', () => {
  it('INC-026: a fresh snapshot with the same alerts on both sides is in sync', () => {
    const c = compareVehicle(busWith(warning('LOW_FUEL'), warning('TYRE_PRESSURE_LOW', 'RRO')), platformWith([['LOW_FUEL', null], ['TYRE_PRESSURE_LOW', 'RRO']]), NOW);
    assert.equal(c.inSync, true);
    assert.deepEqual([c.missingOnPlatform, c.staleOnPlatform], [[], []]);
  });

  it('INC-026: an alert the bus holds that the platform lacks is reported as missing', () => {
    const c = compareVehicle(busWith(warning('ENGINE_OVERHEAT'), warning('LOW_FUEL')), platformWith([['LOW_FUEL', null]]), NOW);
    assert.deepEqual(c.missingOnPlatform, [{ code: 'ENGINE_OVERHEAT', component: null }]);
    assert.equal(c.inSync, false);
  });

  it('INC-026: an alert the platform still holds after the bus cleared it is reported as stale', () => {
    const c = compareVehicle(busWith(), platformWith([['LOW_FUEL', null]]), NOW);
    assert.deepEqual(c.staleOnPlatform, [{ code: 'LOW_FUEL', component: null }]);
    assert.equal(c.inSync, false);
  });

  it('INC-026: the same alert on a different tyre is a different alert', () => {
    const c = compareVehicle(busWith(warning('TYRE_PRESSURE_LOW', 'FL')), platformWith([['TYRE_PRESSURE_LOW', 'RRO']]), NOW);
    assert.deepEqual(c.missingOnPlatform, [{ code: 'TYRE_PRESSURE_LOW', component: 'FL' }]);
    assert.deepEqual(c.staleOnPlatform, [{ code: 'TYRE_PRESSURE_LOW', component: 'RRO' }]);
  });

  it('INC-026: an old snapshot is stale even when the alerts match, and a fresh one is not', () => {
    const bus = busWith();
    assert.equal(compareVehicle(bus, platformWith([], STALE_AFTER_S + 5), NOW).stale, true);
    assert.equal(compareVehicle(bus, platformWith([], STALE_AFTER_S + 5), NOW).inSync, false);
    assert.equal(compareVehicle(bus, platformWith([], STALE_AFTER_S - 5), NOW).stale, false);
  });

  it('INC-026: differing readings alone are not a fault — the platform only receives a snapshot every few seconds', () => {
    const bus = busWith();
    bus.fuel.levelPct = 63;
    const c = compareVehicle(bus, platformWith([], 3), NOW); // platform says 10% fuel
    assert.equal(c.inSync, true);
  });

  it('INC-026: with no platform snapshot there is no age and it is not in sync', () => {
    const c = compareVehicle(busWith(warning('LOW_FUEL')), null, NOW);
    assert.equal(c.ageS, null);
    assert.equal(c.stale, false);
    assert.equal(c.inSync, false);
    assert.deepEqual(c.missingOnPlatform, [{ code: 'LOW_FUEL', component: null }]);
  });

  it("INC-026: age uses the device's timestamp, falling back to when the platform ingested it", () => {
    const p = platformWith([], 4);
    assert.equal(compareVehicle(busWith(), p, NOW).ageS, 4);
    p.deviceTimestamp = null;
    p.ingestedAt = iso(9);
    assert.equal(compareVehicle(busWith(), p, NOW).ageS, 9);
  });
});

// --- the poller's session handling ---------------------------------------------------------

class FakeSource implements VehicleSource {
  logins = 0;
  reads: Array<{ token: string; busId: string }> = [];
  loginBehaviour: () => string | Error = () => `token-${this.logins}`;
  readBehaviour: (token: string, busId: string) => VehicleStateResult | Error | Promise<VehicleStateResult> = () => ({ status: 'ok', data: platformWith([]) });

  async login(): Promise<string> {
    this.logins++;
    const result = this.loginBehaviour();
    if (result instanceof Error) throw result;
    return result;
  }

  async getVehicleState(token: string, busId: string): Promise<VehicleStateResult> {
    this.reads.push({ token, busId });
    const result = await this.readBehaviour(token, busId);
    if (result instanceof Error) throw result;
    return result;
  }
}

describe('INC-026 polling the platform', () => {
  it('INC-026: signs in once and reuses the session across reads', async () => {
    const source = new FakeSource();
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    await poller.pollOnce();
    await poller.pollOnce();
    assert.equal(source.logins, 1);
    assert.equal(source.reads.length, 3);
    assert.equal(poller.snapshot().state, 'ok');
  });

  it('INC-026: an expired session is renewed with one sign-in and the read is retried', async () => {
    const source = new FakeSource();
    source.readBehaviour = (token) => (token === 'token-1' ? new HttpError(401, 'expired') : { status: 'ok', data: platformWith([]) });
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    assert.equal(source.logins, 2);
    assert.deepEqual(source.reads.map((r) => r.token), ['token-1', 'token-2']);
    assert.equal(poller.snapshot().state, 'ok');
    await poller.pollOnce();
    assert.equal(source.logins, 2, 'the renewed session is kept');
  });

  it('INC-026: a session that stays refused is reported once per poll, not retried forever', async () => {
    const source = new FakeSource();
    source.readBehaviour = () => new HttpError(403, 'vehicle state read refused (403)');
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    assert.equal(source.logins, 2);
    assert.equal(source.reads.length, 2);
    assert.equal(poller.snapshot().state, 'error');
    assert.match(poller.snapshot().error ?? '', /403/);
  });

  it('INC-026: a bus with no state yet is waiting, not an error, and then shows data once it appears', async () => {
    const source = new FakeSource();
    source.readBehaviour = () => ({ status: 'none' });
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    assert.deepEqual(poller.snapshot(), { state: 'waiting', error: null, data: null });
    source.readBehaviour = () => ({ status: 'ok', data: platformWith([['LOW_FUEL', null]]) });
    await poller.pollOnce();
    assert.equal(poller.snapshot().state, 'ok');
    assert.equal(poller.snapshot().data?.activeAlerts.length, 1);
  });

  it('INC-026: an unreachable platform is reported, and the last good data stays on screen', async () => {
    const source = new FakeSource();
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    source.readBehaviour = () => new Error('connect ECONNREFUSED');
    await poller.pollOnce();
    const view = poller.snapshot();
    assert.equal(view.state, 'error');
    assert.match(view.error ?? '', /ECONNREFUSED/);
    assert.ok(view.data, 'the previous reading is not blanked by a blip');
    source.readBehaviour = () => ({ status: 'ok', data: platformWith([]) });
    await poller.pollOnce();
    assert.equal(poller.snapshot().state, 'ok');
  });

  it('INC-026: a failing sign-in is reported and retried on the next poll', async () => {
    const source = new FakeSource();
    source.loginBehaviour = () => new HttpError(401, 'login refused (401)');
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    assert.equal(poller.snapshot().state, 'error');
    source.loginBehaviour = () => 'good-token';
    await poller.pollOnce();
    assert.equal(poller.snapshot().state, 'ok');
    assert.equal(source.reads.at(-1)?.token, 'good-token');
  });

  it("INC-026: switching bus drops the old bus's data at once and discards a read still in flight for it", async () => {
    const source = new FakeSource();
    let release!: (r: VehicleStateResult) => void;
    source.readBehaviour = (_token, busId) =>
      busId === 'bus-A' ? new Promise<VehicleStateResult>((resolve) => { release = resolve; }) : { status: 'none' };
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-A');
    const inFlight = poller.pollOnce();
    await new Promise((r) => setImmediate(r));

    poller.watchBus('bus-B');
    release({ status: 'ok', data: platformWith([['LOW_FUEL', null]]) }); // bus A's answer arrives late
    await inFlight;
    assert.deepEqual(poller.snapshot(), { state: 'waiting', error: null, data: null }, "bus A's data must not appear under bus B");

    await poller.pollOnce();
    assert.equal(source.reads.at(-1)?.busId, 'bus-B');
  });

  it('INC-026: reads never overlap', async () => {
    const source = new FakeSource();
    let release!: () => void;
    source.readBehaviour = () => new Promise<VehicleStateResult>((resolve) => { release = () => resolve({ status: 'none' }); });
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    const first = poller.pollOnce();
    await new Promise((r) => setImmediate(r));
    await poller.pollOnce(); // returns at once: one is already in flight
    assert.equal(source.reads.length, 1);
    release();
    await first;
  });

  it('INC-026: with no staff sign-in it stays disabled and never touches the platform', async () => {
    const source = new FakeSource();
    const poller = new VehiclePoller(source, false);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    assert.equal(poller.snapshot().state, 'disabled');
    assert.equal(source.logins + source.reads.length, 0);
  });

  it('INC-026: watching the bus it already watches keeps what it knows', async () => {
    const source = new FakeSource();
    const poller = new VehiclePoller(source, true);
    poller.watchBus('bus-1');
    await poller.pollOnce();
    poller.watchBus('bus-1');
    assert.equal(poller.snapshot().state, 'ok');
  });
});
