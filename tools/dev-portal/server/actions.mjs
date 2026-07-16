// Executes start/stop for a service+environment.
//
// The portal controls only containerized services, so every action is a Docker
// Compose command — `docker compose [-f file] up -d [--build] <service>` to start,
// `docker compose [-f file] stop <service>` to stop. There's no process to track:
// the Docker daemon owns the lifecycle, which keeps this server stateless.
//
// Safety: commands are built ONLY from the registry descriptor and the requested
// env — never from raw request input. The service id/env are validated against the
// registry before we get here. Runs are bounded by a timeout so a hung build can't
// wedge the portal.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { services, REPO_ROOT } from '../services.config.mjs';

const execFileAsync = promisify(execFile);

const COMPOSE_TIMEOUT_MS = 180_000; // builds can be slow

function resolve(serviceId, env) {
  const svc = services.find((s) => s.id === serviceId);
  if (!svc) return { error: `Unknown service "${serviceId}"` };
  if (!svc.envs.includes(env)) return { error: `"${serviceId}" has no "${env}" environment` };
  const action = svc.actions?.[env];
  if (!action) {
    return { error: `${serviceId} · ${env} is monitor-only — start/stop it where you ran it.` };
  }
  return { svc, action };
}

function composeArgs(action, verb) {
  // verb: 'up' | 'stop'
  const args = ['compose'];
  if (action.file) args.push('-f', action.file);
  if (verb === 'up') {
    args.push('up', '-d');
    if (action.build) args.push('--build');
    args.push(action.service);
  } else {
    args.push('stop', action.service);
  }
  return args;
}

async function runCompose(action, verb) {
  const args = composeArgs(action, verb);
  try {
    await execFileAsync('docker', args, { cwd: REPO_ROOT, timeout: COMPOSE_TIMEOUT_MS });
    return { ok: true, message: `docker ${args.join(' ')}` };
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim().split('\n').slice(-3).join(' ');
    return { ok: false, message: `docker ${args.join(' ')} failed: ${detail}` };
  }
}

/** Start a service in an environment (Docker Compose). */
export async function startService(serviceId, env) {
  const r = resolve(serviceId, env);
  if (r.error) return { ok: false, message: r.error };
  return runCompose(r.action, 'up');
}

/** Stop a service in an environment (Docker Compose). */
export async function stopService(serviceId, env) {
  const r = resolve(serviceId, env);
  if (r.error) return { ok: false, message: r.error };
  return runCompose(r.action, 'stop');
}
