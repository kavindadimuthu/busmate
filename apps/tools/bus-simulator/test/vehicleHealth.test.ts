import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import Ajv from 'ajv';
import { Simulation } from '../src/core/simulation.ts';
import type { SimRoute } from '../src/core/route.ts';
import type { FaultId, Report, TyrePosition } from '../src/core/types.ts';

// The published contract itself, read from the schema library, so a drift between what the simulator
// sends and what the platform accepts fails here rather than as a 400 at runtime.
const schema = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../../libs/iot-schemas/schemas/${name}`, import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validateVehicle = ajv.compile(schema('vehicle-telemetry.v1.json'));
const validateAlert = ajv.compile(schema('alert.v1.json'));

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

const SECOND = 10; // steps per simulated second
const newSim = (seed = 7) => new Simulation({ route: ROUTE, seed });

function run(sim: Simulation, seconds: number): Report[] {
  const out: Report[] = [];
  for (let i = 0; i < seconds; i++) {
    sim.step(SECOND);
    out.push(...sim.drainReports());
  }
  return out;
}

const alerts = (reports: Report[]) => reports.filter((r): r is Extract<Report, { kind: 'alert' }> => r.kind === 'alert');
const snapshots = (reports: Report[]) => reports.filter((r): r is Extract<Report, { kind: 'vehicle-telemetry' }> => r.kind === 'vehicle-telemetry');

describe('INC-025 vehicle-health payload', () => {
  it('INC-025: every snapshot validates against the published vehicle-telemetry schema, whatever the bus is doing', () => {
    const sim = newSim();
    const reports: Report[] = [];
    const faults: Array<[FaultId, TyrePosition?]> = [['tyre-leak', 'RRO'], ['overheat'], ['fuel-leak'], ['gps-dropout']];
    reports.push(...run(sim, 120));
    for (const [fault, tyre] of faults) {
      sim.apply({ type: 'injectFault', fault, ...(tyre ? { tyre } : {}) });
      reports.push(...run(sim, 240));
    }
    sim.apply({ type: 'setFuelLevel', pct: 0 });
    reports.push(...run(sim, 60));
    sim.apply({ type: 'setIgnition', on: false });
    reports.push(...run(sim, 120));

    const shots = snapshots(reports);
    assert.ok(shots.length > 50, `expected many snapshots, got ${shots.length}`);
    for (const shot of shots) {
      assert.ok(validateVehicle(shot.payload), `${JSON.stringify(shot.payload)} :: ${ajv.errorsText(validateVehicle.errors)}`);
    }
  });

  it('INC-025: the payload carries counts and readings only, nothing that identifies a person', () => {
    const shot = snapshots(run(newSim(), 30))[0];
    const text = JSON.stringify(shot.payload).toLowerCase();
    for (const word of ['driver', 'name', 'passengername', 'phone', 'email']) assert.ok(!text.includes(word), word);
    assert.equal(typeof shot.payload.cabin.passengers, 'number');
  });

  it('INC-025: snapshots follow the model on their own cadence, more slowly with the ignition off', () => {
    const on = snapshots(run(newSim(), 60)).length;
    const sim = newSim();
    sim.apply({ type: 'setIgnition', on: false });
    const off = snapshots(run(sim, 60)).length;
    assert.ok(on >= 10 && on <= 13, `ignition on: ${on} snapshots in 60 s`);
    assert.ok(off >= 1 && off < on / 2, `ignition off: ${off} snapshots`);
  });

  it('INC-025: a snapshot is still produced while GPS has no fix', () => {
    const sim = newSim();
    sim.apply({ type: 'injectFault', fault: 'gps-dropout' });
    const reports = run(sim, 60);
    assert.equal(reports.filter((r) => r.kind === 'location').length, 0);
    assert.ok(snapshots(reports).length > 5);
  });
});

describe('INC-025 alerts', () => {
  it('INC-025: a tyre leak raises a pressure alert for that tyre, and repairing it clears the alert', () => {
    const sim = newSim();
    run(sim, 30);
    sim.apply({ type: 'injectFault', fault: 'tyre-leak', tyre: 'RRO' });
    const raised = alerts(run(sim, 900));
    assert.deepEqual(
      raised.map((a) => [a.code, a.state, a.component, a.severity]),
      [['TYRE_PRESSURE_LOW', 'raised', 'RRO', 'warning']],
    );
    for (const a of raised) assert.ok(validateAlert({ code: a.code, state: a.state, severity: a.severity, component: a.component, message: a.message }));

    sim.apply({ type: 'clearFault', fault: 'tyre-leak' });
    const cleared = alerts(run(sim, 5));
    assert.deepEqual(cleared.map((a) => [a.code, a.state, a.component]), [['TYRE_PRESSURE_LOW', 'cleared', 'RRO']]);
  });

  it('INC-025: no alert is raised twice without a clear in between, across a long messy run', () => {
    const sim = newSim();
    const all: Report[] = [];
    all.push(...run(sim, 60));
    sim.apply({ type: 'injectFault', fault: 'overheat' });
    all.push(...run(sim, 400));
    sim.apply({ type: 'clearFault', fault: 'overheat' });
    sim.apply({ type: 'injectFault', fault: 'fuel-leak' });
    sim.apply({ type: 'injectFault', fault: 'gps-dropout' });
    all.push(...run(sim, 600));
    sim.apply({ type: 'setFuelLevel', pct: 100 });
    sim.apply({ type: 'clearFault', fault: 'fuel-leak' });
    sim.apply({ type: 'clearFault', fault: 'gps-dropout' });
    all.push(...run(sim, 400));

    const open = new Set<string>();
    for (const a of alerts(all)) {
      const key = `${a.code}:${a.component ?? ''}`;
      if (a.state === 'raised') {
        assert.ok(!open.has(key), `${key} raised twice`);
        open.add(key);
      } else {
        assert.ok(open.has(key), `${key} cleared without being raised`);
        open.delete(key);
      }
    }
    assert.ok(alerts(all).length >= 6, 'the run should have raised and cleared several alerts');
  });

  it('INC-025: overheating and an empty tank are critical, low fuel is only a warning', () => {
    const sim = newSim();
    sim.apply({ type: 'setFuelLevel', pct: 10 });
    sim.apply({ type: 'injectFault', fault: 'overheat' });
    const seen = alerts(run(sim, 600));
    const severity = (code: string) => seen.find((a) => a.code === code && a.state === 'raised')?.severity;
    assert.equal(severity('LOW_FUEL'), 'warning');
    assert.equal(severity('ENGINE_OVERHEAT'), 'critical');
    sim.apply({ type: 'setFuelLevel', pct: 0 });
    assert.equal(
      alerts(run(sim, 5)).find((a) => a.code === 'FUEL_EMPTY')?.severity,
      'critical',
    );
  });

  it('INC-025: closing out a bus clears every alert it had raised, and only those', () => {
    const sim = newSim();
    sim.apply({ type: 'injectFault', fault: 'tyre-leak', tyre: 'FL' });
    sim.apply({ type: 'injectFault', fault: 'overheat' });
    sim.apply({ type: 'setFuelLevel', pct: 5 });
    const raised = alerts(run(sim, 900)).filter((a) => a.state === 'raised');
    assert.ok(raised.length >= 3);

    const closing = sim.closeOut();
    assert.ok(closing.every((r) => r.kind === 'alert' && r.state === 'cleared'));
    assert.equal(closing.length, raised.length);
    assert.deepEqual(sim.closeOut(), [], 'a second close-out has nothing left to clear');
  });
});
