import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Simulation } from '../src/core/simulation.ts';
import { buildPath, fromCoreServiceRoute, type SimRoute } from '../src/core/route.ts';
import type { Command, VehicleState } from '../src/core/types.ts';

// Three stops about 1.5 km apart on a straight line north of Colombo Fort.
const ROUTE: SimRoute = {
  id: 'test-route',
  name: 'Test route',
  roadType: 'NORMALWAY',
  stops: [
    { stopId: 's1', name: 'First', lat: 6.9344, lng: 79.8428 },
    { stopId: 's2', name: 'Second', lat: 6.9479, lng: 79.8428 },
    { stopId: 's3', name: 'Third', lat: 6.9614, lng: 79.8428 },
  ],
};

const SECONDS = 10; // steps per simulated second
const newSim = (seed = 7, extra: Partial<ConstructorParameters<typeof Simulation>[0]> = {}) =>
  new Simulation({ route: ROUTE, seed, ...extra });

function samples(sim: Simulation, seconds: number): VehicleState[] {
  const out: VehicleState[] = [];
  for (let i = 0; i < seconds; i++) {
    sim.step(SECONDS);
    out.push(sim.snapshot());
  }
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('INC-022 physics relationships', () => {
  it('INC-022: RPM follows road speed through the selected gear', () => {
    const moving = samples(newSim(), 600).filter((s) => s.engine.running && s.motion.speedKmh > 5);
    assert.ok(moving.length > 50, 'bus should spend time moving');
    for (const s of moving) {
      assert.ok(s.engine.rpm >= 650 && s.engine.rpm <= 2600, `rpm ${s.engine.rpm} out of range`);
    }
    const slowGears = moving.filter((s) => s.motion.speedKmh < 15).map((s) => s.engine.gear);
    const fastGears = moving.filter((s) => s.motion.speedKmh > 35).map((s) => s.engine.gear);
    assert.ok(slowGears.length && fastGears.length);
    assert.ok(mean(fastGears) > mean(slowGears) + 1, 'higher speeds should use higher gears');
  });

  it('INC-022: fuel burns faster under load than at idle', () => {
    const all = samples(newSim(), 600).filter((s) => s.engine.running);
    const loaded = all.filter((s) => s.motion.throttlePct > 50).map((s) => s.fuel.rateLph);
    const idle = all.filter((s) => s.motion.speedKmh === 0).map((s) => s.fuel.rateLph);
    assert.ok(loaded.length && idle.length);
    assert.ok(mean(loaded) > mean(idle) * 2, `loaded ${mean(loaded)} vs idle ${mean(idle)}`);
  });

  it('INC-022: fuel level only ever falls while driving', () => {
    const levels = samples(newSim(), 300).map((s) => s.fuel.levelL);
    for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1]);
    assert.ok(levels[levels.length - 1] < levels[0]);
  });

  it('INC-022: tyres run warmer, and read higher pressure, at speed than when parked', () => {
    const sim = newSim();
    const cold = sim.snapshot().tyres[0];
    const warm = samples(sim, 400).at(-1)!.tyres[0];
    assert.ok(warm.tempC > cold.tempC + 5);
    assert.ok(warm.pressureKpa > cold.pressureKpa);
  });

  it('INC-022: serves every stop in order, then loops back along the route', () => {
    const run = samples(newSim(), 1200);
    const served = Math.max(...run.map((s) => s.trip.stopsServed));
    assert.ok(served >= 2, `served ${served} stops`);
    assert.ok(run.some((s) => s.trip.reversed), 'should start the return leg after the terminus');
    assert.ok(run.some((s) => s.cabin.doorsOpen) && run.some((s) => !s.cabin.doorsOpen));
    for (const s of run) assert.ok(s.cabin.passengers >= 0 && s.cabin.passengers <= s.cabin.capacity);
  });
});

describe('INC-022 controls', () => {
  it('INC-022: ignition off stops the engine and the bus, and reports OFFLINE', () => {
    const sim = newSim();
    samples(sim, 120);
    sim.drainReports();
    sim.apply({ type: 'setIgnition', on: false });
    const after = samples(sim, 60).at(-1)!;
    assert.equal(after.engine.running, false);
    assert.equal(after.engine.rpm, 0);
    assert.equal(after.motion.speedKmh, 0);
    assert.equal(after.fuel.rateLph, 0);
    const statuses = sim.drainReports().filter((r) => r.kind === 'device-status');
    assert.deepEqual(statuses.map((r) => r.kind === 'device-status' && r.status), ['OFFLINE']);

    sim.apply({ type: 'setIgnition', on: true });
    assert.equal(sim.snapshot().engine.running, true);
    assert.ok(sim.drainReports().some((r) => r.kind === 'device-status' && r.status === 'ONLINE'));
  });

  it('INC-022: a speed limit caps the bus', () => {
    const sim = newSim(7, { driverProfile: 'aggressive' });
    sim.apply({ type: 'setSpeedLimit', kmh: 20 });
    const top = Math.max(...samples(sim, 600).map((s) => s.motion.speedKmh));
    assert.ok(top <= 21, `top speed ${top}`);
  });

  it('INC-022: an aggressive driver accelerates harder than a smooth one', () => {
    const peakAccel = (profile: 'smooth' | 'aggressive') =>
      Math.max(...samples(newSim(7, { driverProfile: profile }), 300).map((s) => s.motion.accelMps2));
    assert.ok(peakAccel('aggressive') > peakAccel('smooth'));
  });
});

describe('INC-022 faults', () => {
  it('INC-022: a tyre leak drains only that tyre until repaired', () => {
    const sim = newSim();
    samples(sim, 30);
    const before = sim.snapshot().tyres;
    sim.apply({ type: 'injectFault', fault: 'tyre-leak', tyre: 'RRO' });
    const after = samples(sim, 600).at(-1)!;
    const rro = (s: VehicleState['tyres']) => s.find((t) => t.position === 'RRO')!;
    const fl = (s: VehicleState['tyres']) => s.find((t) => t.position === 'FL')!;
    assert.ok(rro(after.tyres).pressureKpa < rro(before).pressureKpa - 100);
    assert.ok(Math.abs(fl(after.tyres).pressureKpa - fl(before).pressureKpa) < 60);
    assert.ok(after.warnings.some((w) => w.code === 'TYRE_PRESSURE_LOW' && w.tyre === 'RRO'));

    sim.apply({ type: 'clearFault', fault: 'tyre-leak' });
    const repaired = samples(sim, 5).at(-1)!;
    assert.ok(!repaired.warnings.some((w) => w.code === 'TYRE_PRESSURE_LOW'));
    assert.equal(repaired.faults.length, 0);
  });

  it('INC-022: overheating raises coolant, warns, then derates the engine; clearing it recovers', () => {
    const sim = newSim();
    samples(sim, 300);
    sim.apply({ type: 'injectFault', fault: 'overheat' });
    const hot = samples(sim, 400).at(-1)!;
    assert.ok(hot.engine.coolantTempC > 112);
    assert.ok(hot.engine.derated);
    assert.ok(hot.warnings.some((w) => w.code === 'ENGINE_OVERHEAT'));
    sim.apply({ type: 'clearFault', fault: 'overheat' });
    const cooled = samples(sim, 600).at(-1)!;
    assert.ok(cooled.engine.coolantTempC < 100);
    assert.equal(cooled.engine.derated, false);
  });

  it('INC-022: a fuel leak drains fuel faster than driving alone', () => {
    const used = (leak: boolean) => {
      const sim = newSim();
      if (leak) sim.apply({ type: 'injectFault', fault: 'fuel-leak' });
      const start = sim.snapshot().fuel.levelL;
      return start - samples(sim, 300).at(-1)!.fuel.levelL;
    };
    assert.ok(used(true) > used(false) * 2);
  });

  it('INC-022: low fuel warns, and an empty tank stalls the engine', () => {
    const sim = newSim();
    sim.apply({ type: 'setFuelLevel', pct: 10 });
    assert.ok(sim.snapshot().warnings.some((w) => w.code === 'LOW_FUEL'));
    sim.apply({ type: 'setFuelLevel', pct: 0 });
    const empty = samples(sim, 60).at(-1)!;
    assert.equal(empty.engine.running, false);
    assert.equal(empty.motion.speedKmh, 0);
    assert.ok(empty.warnings.some((w) => w.code === 'FUEL_EMPTY'));
    sim.apply({ type: 'setFuelLevel', pct: 100 });
    assert.equal(sim.snapshot().engine.running, true);
  });

  it('INC-022: a GPS dropout stops location reports until it ends, while the bus keeps moving', () => {
    const sim = newSim();
    samples(sim, 60);
    sim.drainReports();
    sim.apply({ type: 'injectFault', fault: 'gps-dropout' });
    const during = samples(sim, 120);
    assert.equal(sim.drainReports().filter((r) => r.kind === 'location').length, 0);
    assert.ok(during.at(-1)!.motion.odometerKm > during[0].motion.odometerKm);
    assert.equal(during.at(-1)!.gps.fix, false);
    sim.apply({ type: 'clearFault', fault: 'gps-dropout' });
    samples(sim, 30);
    assert.ok(sim.drainReports().filter((r) => r.kind === 'location').length >= 5);
  });
});

describe('INC-022 determinism', () => {
  const script: Array<[number, Command]> = [
    [100, { type: 'setDriverProfile', profile: 'aggressive' }],
    [200, { type: 'injectFault', fault: 'tyre-leak', tyre: 'FR' }],
    [300, { type: 'setIgnition', on: false }],
    [330, { type: 'setIgnition', on: true }],
    [400, { type: 'injectFault', fault: 'gps-dropout' }],
    [450, { type: 'clearFault', fault: 'gps-dropout' }],
  ];
  const run = (seed: number) => {
    const sim = newSim(seed);
    for (let second = 0; second < 600; second++) {
      for (const [at, command] of script) if (at === second) sim.apply(command);
      sim.step(SECONDS);
    }
    return { reports: sim.drainReports(), final: sim.snapshot() };
  };

  it('INC-022: the same seed and inputs produce the same telemetry sequence', () => {
    assert.deepEqual(run(1234), run(1234));
  });

  it('INC-022: a different seed produces a different run', () => {
    assert.notDeepEqual(run(1234).reports, run(4321).reports);
  });
});

describe('INC-022 routes from core-service', () => {
  it('INC-022: orders stops by stopOrder and skips stops without coordinates', () => {
    const route = fromCoreServiceRoute({
      id: 'r',
      name: 'R',
      roadType: null,
      routeStops: [
        { stopId: 'b', stopName: 'B', stopOrder: 2, location: { latitude: 7, longitude: 80 } },
        { stopId: 'x', stopName: 'X', stopOrder: 1, location: { latitude: null, longitude: null } },
        { stopId: 'a', stopName: 'A', stopOrder: 0, location: { latitude: 6.9, longitude: 79.9 } },
      ],
    });
    assert.deepEqual(route.stops.map((s) => s.stopId), ['a', 'b']);
    assert.equal(route.roadType, 'NORMALWAY');
  });

  it('INC-022: refuses a route with fewer than two located stops', () => {
    assert.throws(() => buildPath({ ...ROUTE, stops: ROUTE.stops.slice(0, 1) }), /at least 2/);
  });
});
