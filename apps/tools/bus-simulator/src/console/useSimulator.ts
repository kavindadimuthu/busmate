import { useCallback, useEffect, useState } from 'react';
import type { ConsoleState, ControlRequest, LogEntry, RouteSummary, SessionInfo } from '../shared/protocol.ts';

const LOG_LIMIT = 200;

export type Connection = 'connecting' | 'open' | 'lost';

export interface SimulatorFeed {
  connection: Connection;
  state: ConsoleState | null;
  session: SessionInfo | null;
  log: LogEntry[];
  routes: RouteSummary[];
  /** Last control the server refused, for showing next to the controls. */
  controlError: string | null;
  send: (request: ControlRequest) => Promise<void>;
}

export function useSimulator(): SimulatorFeed {
  const [connection, setConnection] = useState<Connection>('connecting');
  const [state, setState] = useState<ConsoleState | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [controlError, setControlError] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/events');
    source.onopen = () => setConnection('open');
    // EventSource reconnects by itself; the server replays session, log and state each time.
    source.onerror = () => setConnection(source.readyState === EventSource.CLOSED ? 'lost' : 'connecting');
    source.addEventListener('state', (e) => setState(JSON.parse((e as MessageEvent).data)));
    source.addEventListener('session', (e) => setSession(JSON.parse((e as MessageEvent).data)));
    source.addEventListener('log', (e) => {
      const entry: LogEntry = JSON.parse((e as MessageEvent).data);
      setLog((prev) => (prev.some((p) => p.id === entry.id) ? prev : [...prev, entry].slice(-LOG_LIMIT)));
    });
    return () => source.close();
  }, []);

  useEffect(() => {
    fetch('/api/routes')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const send = useCallback(async (request: ControlRequest) => {
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        setControlError(null);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setControlError(body.error ?? `HTTP ${res.status}`);
    } catch {
      setControlError('simulator server unreachable');
    }
  }, []);

  return { connection, state, session, log, routes, controlError, send };
}
