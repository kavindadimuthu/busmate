// Manages the long-lived processes the portal starts via `pnpm dev:*`.
//
// Docker services are fire-and-forget (the daemon owns their lifecycle), but a
// `pnpm dev` server is a process WE spawn and must be able to stop. This keeps an
// in-memory table keyed by `${serviceId}:${env}`, tracks each child's state, buffers
// its recent output, and can kill the whole process tree.
//
// Tree-kill note: `pnpm dev:core-service` forks children (mvnw → java, etc.). We spawn
// the child as its own process-group leader (`detached: true`) and signal the whole
// group with `process.kill(-pid)` so nothing is left orphaned. State is in-memory only —
// if the portal server itself restarts, previously spawned processes keep running but
// are no longer tracked (a direct `pnpm dev` you'd Ctrl-C yourself). This is called out
// in the UI.

import { spawn } from 'node:child_process';

const LOG_LIMIT = 400; // ring-buffer size per process

/** @type {Map<string, {
 *   key: string, serviceId: string, env: string, child: import('node:child_process').ChildProcess,
 *   state: 'starting'|'running'|'exited'|'failed', pid: number, startedAt: number,
 *   exitCode: number|null, logs: string[] }>} */
const procs = new Map();

const keyOf = (serviceId, env) => `${serviceId}:${env}`;

function pushLog(entry, line) {
  for (const l of line.split(/\r?\n/)) {
    if (l.length === 0) continue;
    entry.logs.push(l);
    if (entry.logs.length > LOG_LIMIT) entry.logs.shift();
  }
}

/**
 * Spawn a managed `pnpm run <script>` process from `cwd`.
 * @returns {{ ok: boolean, message: string }}
 */
export function startProcess({ serviceId, env, script, cwd }) {
  const key = keyOf(serviceId, env);
  const existing = procs.get(key);
  if (existing && (existing.state === 'starting' || existing.state === 'running')) {
    return { ok: false, message: `Already running (pid ${existing.pid})` };
  }

  // detached: own process group so we can tree-kill later.
  const child = spawn('pnpm', ['run', script], {
    cwd,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  const entry = {
    key, serviceId, env, child,
    state: 'starting', pid: child.pid, startedAt: Date.now(),
    exitCode: null, logs: [],
  };
  procs.set(key, entry);

  pushLog(entry, `$ pnpm run ${script}  (pid ${child.pid}, cwd ${cwd})`);
  child.stdout.on('data', (d) => { pushLog(entry, d.toString()); if (entry.state === 'starting') entry.state = 'running'; });
  child.stderr.on('data', (d) => pushLog(entry, d.toString()));

  child.on('error', (err) => {
    entry.state = 'failed';
    pushLog(entry, `spawn error: ${err.message}`);
  });
  child.on('exit', (code, signal) => {
    entry.exitCode = code;
    // A clean stop is code 0 or a kill signal we sent; anything else is a failure.
    entry.state = (code === 0 || signal) ? 'exited' : 'failed';
    pushLog(entry, `process exited (code ${code}${signal ? `, signal ${signal}` : ''})`);
  });

  return { ok: true, message: `Started (pid ${child.pid})` };
}

/**
 * Stop a managed process by killing its process group.
 * @returns {{ ok: boolean, message: string }}
 */
export function stopProcess({ serviceId, env }) {
  const key = keyOf(serviceId, env);
  const entry = procs.get(key);
  if (!entry || (entry.state !== 'running' && entry.state !== 'starting')) {
    return { ok: false, message: 'Not tracked by the portal — stop it where you started it.' };
  }
  try {
    process.kill(-entry.pid, 'SIGTERM'); // negative pid → whole group
    pushLog(entry, 'SIGTERM sent to process group');
    // Escalate if it ignores SIGTERM.
    setTimeout(() => {
      if (entry.state === 'running' || entry.state === 'starting') {
        try { process.kill(-entry.pid, 'SIGKILL'); pushLog(entry, 'SIGKILL sent'); } catch { /* gone */ }
      }
    }, 6000);
    return { ok: true, message: 'Stopping…' };
  } catch (err) {
    return { ok: false, message: `Kill failed: ${err.message}` };
  }
}

/** Snapshot of every managed process, keyed by `${serviceId}:${env}`, for /api/status. */
export function managedState() {
  const out = {};
  for (const e of procs.values()) {
    out[e.key] = { serviceId: e.serviceId, env: e.env, state: e.state, pid: e.pid, exitCode: e.exitCode, startedAt: e.startedAt };
  }
  return out;
}

/** Recent log lines for one managed process. */
export function processLogs(serviceId, env) {
  const entry = procs.get(keyOf(serviceId, env));
  return entry ? entry.logs : null;
}

/** Best-effort cleanup of everything we spawned (called on portal shutdown). */
export function killAll() {
  for (const e of procs.values()) {
    if (e.state === 'running' || e.state === 'starting') {
      try { process.kill(-e.pid, 'SIGTERM'); } catch { /* ignore */ }
    }
  }
}
