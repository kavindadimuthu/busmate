import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Report } from '../src/core/types.ts';
import { HttpError, type IngestEventType, type IngestGateway, type IngestResult } from '../src/server/gateway.ts';
import { Publisher, type PublisherEvent } from '../src/server/publisher.ts';

interface Call {
  eventType: IngestEventType;
  body: any;
}

/** A gateway stand-in that records what was sent and fails when told to. */
class FakeGateway implements IngestGateway {
  readonly calls: Call[] = [];
  /** Called before each send; throw to simulate a failure. */
  onCall: (call: Call, attempt: number) => IngestResult | void = () => undefined;
  private attempts = 0;

  async ingest(eventType: IngestEventType, _token: string, body: unknown): Promise<IngestResult> {
    const call = { eventType, body };
    this.calls.push(call);
    return this.onCall(call, this.attempts++) ?? { status: 'accepted', reason: null };
  }
}

const alert = (code: string, state: 'raised' | 'cleared', component?: string): Report =>
  ({ kind: 'alert', simTimeS: 0, code, state, severity: 'warning', ...(component ? { component } : {}), message: `${code} ${state}` }) as Report;
const snapshot = (fuel: number): Report =>
  ({ kind: 'vehicle-telemetry', simTimeS: 0, payload: { ignition: true, fuel: { levelPct: fuel } } }) as unknown as Report;
const location = (lat: number): Report =>
  ({ kind: 'location', simTimeS: 0, lat, lng: 80, speedKmh: 40, headingDeg: 90, accuracyM: 5 }) as Report;

const at = (report: Report) => ({ report, producedAt: new Date('2026-09-19T08:00:00Z') });
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** Pumps at successive wall-clock instants until nothing more is sent, so pacing never gets in the way. */
async function drain(publisher: Publisher, from = 1_000_000, step = 3_000, rounds = 200): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    publisher.pump(from + i * step);
    await settle();
  }
}

describe('INC-025 publisher ordering', () => {
  it('INC-025: alerts are delivered in order and none is merged, while snapshots are thinned to the newest', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([
      at(alert('LOW_FUEL', 'raised')),
      at(snapshot(50)),
      at(snapshot(49)),
      at(snapshot(48)),
      at(alert('LOW_FUEL', 'cleared')),
    ]);
    await drain(publisher);

    const sent = gateway.calls.map((c) => c.eventType);
    assert.deepEqual(sent.filter((t) => t === 'alert'), ['alert', 'alert']);
    assert.deepEqual(gateway.calls.filter((c) => c.eventType === 'alert').map((c) => c.body.payload.state), ['raised', 'cleared']);
    const snapshots = gateway.calls.filter((c) => c.eventType === 'vehicle-telemetry');
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].body.payload.fuel.levelPct, 48, 'only the newest snapshot survives');
    assert.equal(publisher.snapshot().coalesced, 2);
  });

  it('INC-025: a failed alert is retried before any later one, so order survives an outage', async () => {
    const gateway = new FakeGateway();
    gateway.onCall = (_call, attempt) => {
      if (attempt === 0) throw new HttpError(502, 'bad gateway');
    };
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([at(alert('A', 'raised')), at(alert('B', 'raised'))]);
    await drain(publisher, 1_000_000, 20_000);

    assert.deepEqual(
      gateway.calls.map((c) => c.body.payload.code),
      ['A', 'A', 'B'],
    );
    assert.equal(publisher.snapshot().state, 'ok');
  });

  it('INC-025: an event the platform rejects outright is dropped, and does not block the ones behind it', async () => {
    const gateway = new FakeGateway();
    gateway.onCall = (_call, attempt) => {
      if (attempt === 0) throw new HttpError(400, 'invalid');
    };
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([at(alert('A', 'raised')), at(alert('B', 'raised'))]);
    await drain(publisher, 1_000_000, 20_000);

    assert.deepEqual(gateway.calls.map((c) => c.body.payload.code), ['A', 'B']);
  });

  it('INC-025: a rate-limited (429) event is retried, not discarded', async () => {
    const gateway = new FakeGateway();
    gateway.onCall = (_call, attempt) => {
      if (attempt === 0) throw new HttpError(429, 'slow down');
    };
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([at(alert('A', 'raised'))]);
    await drain(publisher, 1_000_000, 20_000);

    assert.deepEqual(gateway.calls.map((c) => c.body.payload.code), ['A', 'A']);
  });

  it('INC-025: past the queue limit the oldest alerts are dropped and counted, never the newest', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue(Array.from({ length: 520 }, (_, i) => at(alert(`CODE${i}`, 'raised'))));
    assert.equal(publisher.snapshot().dropped, 20);
    await drain(publisher, 1_000_000, 1_000, 700);

    assert.equal(gateway.calls.length, 500);
    assert.equal(gateway.calls[0].body.payload.code, 'CODE20');
    assert.equal(gateway.calls.at(-1)!.body.payload.code, 'CODE519');
  });
});

describe('INC-025 publisher robustness', () => {
  it('INC-025: an accepted event is never sent again, even if the listener that displays it throws', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => {
      throw new Error('display broke');
    });
    publisher.enqueue([at(alert('A', 'raised')), at(snapshot(50))]);
    await drain(publisher, 1_000_000, 3_000, 50);

    assert.equal(gateway.calls.filter((c) => c.eventType === 'alert').length, 1);
    assert.equal(gateway.calls.filter((c) => c.eventType === 'vehicle-telemetry').length, 1);
    assert.equal(publisher.snapshot().failed, 0);
  });

  it('INC-025: a snapshot missing whole sections is still delivered once, not retried forever', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([at({ kind: 'vehicle-telemetry', simTimeS: 0, payload: { ignition: false } } as unknown as Report)]);
    await drain(publisher, 1_000_000, 3_000, 50);
    assert.equal(gateway.calls.length, 1);
  });
});

describe('INC-025 publisher payloads', () => {
  it('INC-025: an alert carries its component only when it has one, and its message is capped', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    const long = { ...(alert('LOW_FUEL', 'raised') as any), message: 'x'.repeat(500) } as Report;
    publisher.enqueue([at(alert('TYRE_PRESSURE_LOW', 'raised', 'RRO')), at(long)]);
    await drain(publisher);

    const [tyre, fuel] = gateway.calls.map((c) => c.body.payload);
    assert.equal(tyre.component, 'RRO');
    assert.ok(!('component' in fuel));
    assert.equal(fuel.message.length, 200);
  });

  it('INC-025: the device timestamp is when the model produced the event, not when it was finally sent', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    publisher.enqueue([at(alert('A', 'raised'))]);
    await drain(publisher);
    assert.equal(gateway.calls[0].body.deviceTimestamp, '2026-09-19T08:00:00.000Z');
  });

  it('INC-025: flagged and accepted events are reported differently, and only accepted vehicle events count as sent', async () => {
    const gateway = new FakeGateway();
    gateway.onCall = (call) => (call.eventType === 'vehicle-telemetry' ? { status: 'flagged', reason: 'coolant absurd' } : undefined);
    const events: PublisherEvent[] = [];
    const publisher = new Publisher(gateway, 'token', (e) => events.push(e));
    publisher.enqueue([at(snapshot(50)), at(alert('A', 'raised')), at(location(7))]);
    await drain(publisher);

    assert.ok(events.some((e) => e.kind === 'flagged' && e.message === 'coolant absurd'));
    const status = publisher.snapshot();
    assert.equal(status.flagged, 1);
    assert.ok(status.lastVehicleAcceptedAt, 'the accepted alert is a vehicle event');
  });

  it('INC-025: isIdle is true only when nothing is queued or in flight', async () => {
    const gateway = new FakeGateway();
    const publisher = new Publisher(gateway, 'token', () => undefined);
    assert.equal(publisher.isIdle(), true);
    publisher.enqueue([at(alert('A', 'raised'))]);
    assert.equal(publisher.isIdle(), false);
    await drain(publisher);
    assert.equal(publisher.isIdle(), true);
  });
});
