// Detection layer: figures out, for every registered service, which environments
// it is currently running in.
//
// Two independent signals are merged:
//   1. Docker  — `docker ps` finds containers, `docker inspect` reads their env so
//                we can label the instance dev / prod / e2e / obs. Reliable, and the
//                only way to tell prod from dev when they share a host port.
//   2. Probe   — a direct HTTP/TCP hit on the conventional dev port. Catches services
//                started straight from `pnpm dev` / `nx dev` with no container. Those
//                are labelled the `local` environment.
//
// A service+env is considered "running" if either signal says so. Nothing here
// throws on a missing Docker daemon or a refused connection — absence is just "down".

import { execFile } from 'node:child_process';
import net from 'node:net';
import { promisify } from 'node:util';
import { managedState } from './processManager.mjs';

const execFileAsync = promisify(execFile);

const PROBE_TIMEOUT_MS = 1500;

// Map a container's Spring profile / NODE_ENV / compose project to one of our
// canonical environment names.
function normalizeEnv({ profile, nodeEnv, project }) {
  const p = (profile || '').toLowerCase();
  if (p.includes('prod')) return 'prod';
  if (p.includes('e2e')) return 'e2e';
  if (p.includes('dev')) return 'dev';
  if ((project || '').includes('observability')) return 'obs';
  if ((nodeEnv || '').toLowerCase() === 'production') return 'dev'; // gateway in dev compose sets NODE_ENV=production
  if (project) return project.includes('production') ? 'prod' : 'dev';
  return 'docker';
}

async function getDockerContainers() {
  try {
    // One line of TSV per running container: id, compose-service, compose-project, status.
    const { stdout } = await execFileAsync('docker', [
      'ps',
      '--format',
      '{{.ID}}\t{{.Label "com.docker.compose.service"}}\t{{.Label "com.docker.compose.project"}}\t{{.Status}}\t{{.Names}}',
    ], { timeout: 4000 });

    const rows = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    const containers = rows.map((line) => {
      const [id, service, project, status, names] = line.split('\t');
      return { id, service, project, status, names };
    });

    // Read the env of each container once so we can classify prod vs dev vs e2e.
    await Promise.all(containers.map(async (c) => {
      try {
        const { stdout: envJson } = await execFileAsync('docker', [
          'inspect', '--format', '{{json .Config.Env}}', c.id,
        ], { timeout: 4000 });
        const env = JSON.parse(envJson) || [];
        const find = (k) => {
          const hit = env.find((e) => e.startsWith(`${k}=`));
          return hit ? hit.slice(k.length + 1) : undefined;
        };
        c.profile = find('SPRING_PROFILES_ACTIVE');
        c.nodeEnv = find('NODE_ENV');
      } catch {
        /* inspect failed — leave env fields undefined */
      }
      c.env = normalizeEnv({ profile: c.profile, nodeEnv: c.nodeEnv, project: c.project });
    }));

    return { available: true, containers };
  } catch {
    return { available: false, containers: [] };
  }
}

function probeHttp({ host, port, path }) {
  const url = `http://${host}:${port}${path || '/'}`;
  return fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), redirect: 'manual' })
    // Any HTTP response (even 3xx/4xx) means the port is served by something alive.
    .then((res) => res.status > 0)
    .catch(() => false);
}

function probeTcp({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => { socket.destroy(); resolve(ok); };
    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

const probe = (p) => (p.type === 'tcp' ? probeTcp(p) : probeHttp(p));

/**
 * Build the live status for the whole registry.
 * @returns {Promise<{ dockerAvailable: boolean, generatedAt: string, services: object[] }>}
 */
export async function buildStatus(services) {
  const docker = await getDockerContainers();
  const managed = managedState(); // portal-spawned pnpm processes, keyed `${id}:${env}`

  const results = await Promise.all(services.map(async (svc) => {
    // Start with every declared environment marked "down".
    const envs = {};
    for (const e of svc.envs) envs[e] = { running: false, source: null, detail: null, proc: null };

    // 1. Docker signal.
    if (svc.dockerService) {
      const matches = docker.containers.filter((c) => c.service === svc.dockerService);
      for (const c of matches) {
        const envName = svc.envs.includes(c.env) ? c.env : c.env;
        if (!envs[envName]) envs[envName] = { running: false, source: null, detail: null, proc: null };
        envs[envName] = { running: true, source: 'docker', detail: c.status || c.names, proc: null };
      }
    }

    // 2. Direct probe — attribute to `local` only when no container already claimed
    //    this service (a running container is what answers the port otherwise).
    const claimedByDocker = Object.values(envs).some((e) => e.running && e.source === 'docker');
    let probedUp = false;
    if (svc.probe) {
      probedUp = await probe(svc.probe);
      if (probedUp && !claimedByDocker) {
        if (!envs.local) envs.local = { running: false, source: null, detail: null, proc: null };
        envs.local = { running: true, source: 'process', detail: `port ${svc.probe.port}`, proc: null };
      }
    }

    // 3. Managed-process overlay — surfaces transient states the probe can't see:
    //    a spawned pnpm server that hasn't opened its port yet (starting) or one
    //    that crashed (failed). If its port is already up, the probe above wins.
    for (const [env, e] of Object.entries(envs)) {
      const m = managed[`${svc.id}:${env}`];
      if (!m) continue;
      e.proc = m.state;
      if (!e.running && (m.state === 'starting' || m.state === 'running')) {
        e.source = 'process';
        e.detail = `starting (pid ${m.pid})`;
      }
    }

    const running = Object.values(envs).some((e) => e.running);
    const runningEnvs = Object.entries(envs).filter(([, v]) => v.running).map(([k]) => k);

    return { id: svc.id, running, envs, runningEnvs, probedUp };
  }));

  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  return {
    dockerAvailable: docker.available,
    generatedAt: new Date().toISOString(),
    status: byId,
  };
}
