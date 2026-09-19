import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SimRoute } from '../core/route.ts';
import type { DriverProfileId, FaultId, TyrePosition, VehicleState } from '../core/types.ts';
import { PLAYBACK_SPEEDS, type ConsoleState, type LogEntry, type PlatformView, type SessionInfo } from '../shared/protocol.ts';
import { useSimulator, type SimulatorFeed } from './useSimulator.ts';

/** A platform fix older than this while the bus is reporting reads as stale. */
const STALE_AFTER_MS = 20_000;

export function App() {
  const feed = useSimulator();
  const { state, session } = feed;
  if (!state || !session) {
    return (
      <main className="boot">
        <h1>Bus Simulator</h1>
        <p>{feed.connection === 'lost' ? 'Simulator server is not reachable.' : 'Connecting to the simulator…'}</p>
      </main>
    );
  }
  return (
    <main>
      <Header feed={feed} state={state} session={session} />
      <div className="grid">
        <section className="panel span2">
          <h2>Route</h2>
          <RouteMap route={session.route} vehicle={state.vehicle} platform={state.platform} />
          <TripLine vehicle={state.vehicle} />
        </section>
        <section className="panel">
          <h2>Platform sees</h2>
          <PlatformPanel state={state} />
        </section>
        <section className="panel">
          <h2>Drive</h2>
          <Gauges v={state.vehicle} />
        </section>
        <section className="panel">
          <h2>Tyres</h2>
          <Tyres v={state.vehicle} />
          <h2 className="sub">Cabin</h2>
          <Cabin v={state.vehicle} />
        </section>
        <section className="panel">
          <h2>Controls</h2>
          <Controls feed={feed} state={state} />
        </section>
        <section className="panel span2">
          <h2>Warnings</h2>
          <Warnings v={state.vehicle} />
          <h2 className="sub">Event log</h2>
          <Log entries={feed.log} />
        </section>
      </div>
    </main>
  );
}

function Header({ feed, state, session }: { feed: SimulatorFeed; state: ConsoleState; session: SessionInfo }) {
  const { send, routes } = feed;
  return (
    <header>
      <div>
        <h1>Bus Simulator</h1>
        <p className="muted">
          {session.device.busLabel} · {session.device.serial} → {session.gatewayUrl}
        </p>
      </div>
      <div className="row">
        <label>
          Route
          <select value={session.route.id} onChange={(e) => send({ type: 'setup', routeId: e.target.value })}>
            {!routes.some((r) => r.id === session.route.id) && <option value={session.route.id}>{session.route.name}</option>}
            {routes.map((r) => (
              <option key={r.id} value={r.id} disabled={r.locatedStops < 2}>
                {r.routeNumber ? `${r.routeNumber} · ` : ''}
                {r.name}
                {r.locatedStops < 2 ? ' (no located stops)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bus
          <select value={session.device.serial} onChange={(e) => send({ type: 'setup', deviceSerial: e.target.value })}>
            {session.devices.map((d) => (
              <option key={d.serial} value={d.serial}>
                {d.busLabel}
              </option>
            ))}
          </select>
        </label>
        <span className={`pill ${feed.connection === 'open' ? 'ok' : 'bad'}`}>console {feed.connection}</span>
        <span className={`pill ${state.clock.paused ? 'warn' : 'ok'}`}>{state.clock.paused ? 'paused' : `running ${state.clock.playback}×`}</span>
      </div>
    </header>
  );
}

// --- route map -------------------------------------------------------------------------------

function RouteMap({ route, vehicle, platform }: { route: SimRoute; vehicle: VehicleState; platform: PlatformView }) {
  const W = 720;
  const H = 260;
  const PAD = 28;
  const project = useMemo(() => {
    const lats = route.stops.map((s) => s.lat);
    const lngs = route.stops.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    // Longitude degrees shrink with latitude; without this the route is stretched east–west.
    const kx = Math.cos((midLat * Math.PI) / 180);
    const spanX = Math.max((maxLng - minLng) * kx, 1e-6);
    const spanY = Math.max(maxLat - minLat, 1e-6);
    const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
    const offX = (W - spanX * scale) / 2;
    const offY = (H - spanY * scale) / 2;
    return (lat: number, lng: number) => ({
      x: offX + (lng - minLng) * kx * scale,
      y: H - offY - (lat - minLat) * scale,
    });
  }, [route]);

  const line = route.stops.map((s) => project(s.lat, s.lng));
  const bus = project(vehicle.motion.lat, vehicle.motion.lng);
  const seen = platform.bus ? project(platform.bus.lat, platform.bus.lng) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="map" role="img" aria-label={`Map of ${route.name}`}>
      <polyline points={line.map((p) => `${p.x},${p.y}`).join(' ')} className="route-line" />
      {route.stops.map((s, i) => (
        <g key={s.stopId}>
          <circle cx={line[i].x} cy={line[i].y} r={4} className="stop" />
          <text x={line[i].x + 7} y={line[i].y - 7} className="stop-label">
            {s.name.replace(/\s*\(.*\)/, '')}
          </text>
        </g>
      ))}
      {seen && <circle cx={seen.x} cy={seen.y} r={8} className="platform-dot" />}
      <circle cx={bus.x} cy={bus.y} r={5} className="bus-dot" />
    </svg>
  );
}

function TripLine({ vehicle }: { vehicle: VehicleState }) {
  const t = vehicle.trip;
  const pct = t.totalM > 0 ? (t.distanceM / t.totalM) * 100 : 0;
  const status =
    t.phase === 'dwelling' ? `At stop — doors ${vehicle.cabin.doorsOpen ? 'open' : 'closed'}, leaving in ${Math.ceil(t.dwellRemainingS)} s`
    : t.phase === 'arrived' ? 'Trip finished'
    : `Next: ${t.nextStopName} in ${((t.distanceToNextStopM ?? 0) / 1000).toFixed(1)} km`;
  return (
    <div>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      <p className="muted">
        {t.reversed ? 'Return leg' : 'Outbound'} · {status} · {t.stopsServed} stops served
      </p>
      <p className="legend"><i className="bus-key" /> bus <i className="platform-key" /> platform's view</p>
    </div>
  );
}

// --- gauges ----------------------------------------------------------------------------------

function Gauges({ v }: { v: VehicleState }) {
  return (
    <div className="gauges">
      <Big label="Speed" value={v.motion.speedKmh.toFixed(0)} unit="km/h" />
      <Big label="Engine" value={String(v.engine.rpm)} unit="rpm" sub={`gear ${v.engine.gear || 'N'} · load ${v.engine.loadPct.toFixed(0)}%`} />
      <Big label="Fuel" value={v.fuel.levelPct.toFixed(1)} unit="%" sub={`${v.fuel.levelL.toFixed(0)} L · ${v.fuel.rateLph.toFixed(1)} L/h`} tone={v.fuel.levelPct < 15 ? 'bad' : undefined} />
      <Big label="Coolant" value={v.engine.coolantTempC.toFixed(0)} unit="°C" sub={v.engine.derated ? 'derated' : `oil ${v.engine.oilPressureKpa.toFixed(0)} kPa`} tone={v.engine.coolantTempC >= 105 ? 'bad' : undefined} />
      <Big label="Battery" value={v.electrical.batteryV.toFixed(1)} unit="V" sub={v.electrical.charging ? 'charging' : 'discharging'} tone={v.electrical.batteryV < 24 ? 'warn' : undefined} />
      <Big label="Odometer" value={v.motion.odometerKm.toFixed(1)} unit="km" sub={`${v.engine.hours.toFixed(2)} engine h`} />
    </div>
  );
}

function Big({ label, value, unit, sub, tone }: { label: string; value: string; unit: string; sub?: string; tone?: 'warn' | 'bad' }) {
  return (
    <div className={`big ${tone ?? ''}`}>
      <span className="label">{label}</span>
      <span className="value">{value}<small>{unit}</small></span>
      {sub && <span className="sub-value">{sub}</span>}
    </div>
  );
}

const TYRE_LAYOUT: TyrePosition[][] = [['FL', 'FR'], ['RLO', 'RLI', 'RRI', 'RRO']];

function Tyres({ v }: { v: VehicleState }) {
  const byPos = new Map(v.tyres.map((t) => [t.position, t]));
  return (
    <div className="tyres">
      {TYRE_LAYOUT.map((axle, i) => (
        <div key={i} className={`axle a${axle.length}`}>
          {axle.map((pos) => {
            const t = byPos.get(pos)!;
            const low = t.pressureKpa < 760 * 0.8;
            return (
              <div key={pos} className={`tyre ${low || t.leaking ? 'bad' : ''}`}>
                <b>{pos}</b>
                <span>{(t.pressureKpa / 6.895).toFixed(0)} psi</span>
                <span>{t.tempC.toFixed(0)} °C</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Cabin({ v }: { v: VehicleState }) {
  return (
    <p className="muted">
      {v.cabin.passengers} / {v.cabin.capacity} passengers · doors {v.cabin.doorsOpen ? 'open' : 'closed'} · ignition {v.ignition ? 'on' : 'off'}
    </p>
  );
}

// --- platform view ---------------------------------------------------------------------------

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function PlatformPanel({ state }: { state: ConsoleState }) {
  const now = useNow();
  const { platform, publisher, vehicle } = state;
  const lastAccepted = publisher.lastAcceptedAt ? now - Date.parse(publisher.lastAcceptedAt) : null;
  const seenAgeMs = platform.bus ? now - Date.parse(platform.bus.receivedAt) : null;
  const stale = seenAgeMs != null && seenAgeMs > STALE_AFTER_MS;
  return (
    <div className="stack">
      <Row k="Live stream" v={<span className={`pill ${platform.state === 'connected' ? 'ok' : platform.state === 'disabled' ? '' : 'bad'}`}>{platform.state}</span>} />
      {platform.error && <p className="error">{platform.error}</p>}
      <Row
        k="Position"
        v={
          platform.bus ? (
            <span className={stale ? 'bad-text' : ''}>
              {platform.bus.lat.toFixed(5)}, {platform.bus.lng.toFixed(5)}
              {stale && ' · STALE'}
            </span>
          ) : (
            '—'
          )
        }
      />
      <Row k="Last update" v={seenAgeMs != null ? `${Math.round(seenAgeMs / 1000)} s ago` : '—'} />
      <Row k="Device status" v={platform.deviceStatus?.status ?? '—'} />
      <hr />
      <Row k="Publisher" v={<span className={`pill ${publisher.state === 'failing' ? 'bad' : 'ok'}`}>{publisher.state}</span>} />
      <Row k="Accepted / flagged / failed" v={`${publisher.accepted} / ${publisher.flagged} / ${publisher.failed}`} />
      <Row k="Coalesced (fast playback)" v={String(publisher.coalesced)} />
      <Row k="Last accepted" v={lastAccepted != null ? `${Math.round(lastAccepted / 1000)} s ago` : '—'} />
      {publisher.lastError && <p className="error">{publisher.lastError}</p>}
      {!vehicle.gps.fix && <p className="error">GPS has no fix — no position is being sent.</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="kv">
      <span className="muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

// --- controls --------------------------------------------------------------------------------

const FAULTS: Array<{ id: FaultId; label: string }> = [
  { id: 'tyre-leak', label: 'Tyre leak' },
  { id: 'overheat', label: 'Engine overheat' },
  { id: 'fuel-leak', label: 'Fuel leak' },
  { id: 'gps-dropout', label: 'GPS dropout' },
];

function Controls({ feed, state }: { feed: SimulatorFeed; state: ConsoleState }) {
  const { send } = feed;
  const { clock, vehicle } = state;
  const [tyre, setTyre] = useState<TyrePosition>('FL');
  const [limit, setLimit] = useState(vehicle.speedLimitKmh ?? 60);
  const [fuel, setFuel] = useState(50);
  const active = new Set(vehicle.faults.map((f) => f.id));
  return (
    <div className="stack">
      <div className="row">
        <button onClick={() => send({ type: clock.paused ? 'resume' : 'pause' })}>{clock.paused ? 'Resume' : 'Pause'}</button>
        <button onClick={() => send({ type: 'setIgnition', on: !vehicle.ignition })}>Ignition {vehicle.ignition ? 'off' : 'on'}</button>
        <button onClick={() => send({ type: 'restartTrip' })}>Restart trip</button>
      </div>
      <label>
        Playback speed
        <div className="seg">
          {PLAYBACK_SPEEDS.map((p) => (
            <button key={p} className={clock.playback === p ? 'on' : ''} onClick={() => send({ type: 'setPlayback', playback: p })}>
              {p}×
            </button>
          ))}
        </div>
      </label>
      <label>
        Driver
        <div className="seg">
          {(['smooth', 'normal', 'aggressive'] as DriverProfileId[]).map((p) => (
            <button key={p} className={vehicle.driverProfile === p ? 'on' : ''} onClick={() => send({ type: 'setDriverProfile', profile: p })}>
              {p}
            </button>
          ))}
        </div>
      </label>
      <label>
        Speed limit {vehicle.speedLimitKmh == null ? '(none)' : `${vehicle.speedLimitKmh} km/h`}
        <div className="row">
          <input type="range" min={10} max={100} step={5} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          <button onClick={() => send({ type: 'setSpeedLimit', kmh: limit })}>Set {limit}</button>
          <button onClick={() => send({ type: 'setSpeedLimit', kmh: null })}>Clear</button>
        </div>
      </label>
      <label>
        Fuel
        <div className="row">
          <input type="range" min={0} max={100} step={5} value={fuel} onChange={(e) => setFuel(Number(e.target.value))} />
          <button onClick={() => send({ type: 'setFuelLevel', pct: fuel })}>Set {fuel}%</button>
        </div>
      </label>
      <div>
        <span className="label">Faults</span>
        <div className="faults">
          {FAULTS.map((f) => {
            const on = active.has(f.id);
            return (
              <button
                key={f.id}
                className={on ? 'on danger' : ''}
                onClick={() => send(on ? { type: 'clearFault', fault: f.id } : { type: 'injectFault', fault: f.id, ...(f.id === 'tyre-leak' ? { tyre } : {}) })}
              >
                {on ? `Clear ${f.label.toLowerCase()}` : f.label}
              </button>
            );
          })}
        </div>
        <label className="inline">
          Leaking tyre
          <select value={tyre} onChange={(e) => setTyre(e.target.value as TyrePosition)}>
            {['FL', 'FR', 'RLO', 'RLI', 'RRI', 'RRO'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>
      {feed.controlError && <p className="error">{feed.controlError}</p>}
    </div>
  );
}

// --- warnings and log ------------------------------------------------------------------------

function Warnings({ v }: { v: VehicleState }) {
  if (!v.warnings.length) return <p className="muted">No active warnings.</p>;
  return (
    <ul className="warnings">
      {v.warnings.map((w) => (
        <li key={`${w.code}${w.tyre ?? ''}`}><b>{w.code}</b> {w.message}</li>
      ))}
    </ul>
  );
}

function Log({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [filter, setFilter] = useState<'all' | 'problems'>('all');
  useEffect(() => {
    const el = ref.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [entries]);
  const shown = filter === 'all' ? entries : entries.filter((e) => ['failed', 'flagged', 'warning', 'platform'].includes(e.kind));
  return (
    <>
      <div className="seg">
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'problems' ? 'on' : ''} onClick={() => setFilter('problems')}>Problems</button>
      </div>
      <div className="log" ref={ref} onScroll={(e) => { const el = e.currentTarget; pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24; }}>
        {shown.map((e) => (
          <div key={e.id} className={`entry ${e.kind}`}>
            <time>{new Date(e.at).toLocaleTimeString([], { hour12: false })}</time>
            <span className="kind">{e.kind}</span>
            <span>{e.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
