// Dev-portal server (Express).
//
//   GET  /api/ping                               liveness
//   GET  /api/status                             live status for the whole registry
//   POST /api/services/:id/:env/start            start a service in an environment
//   POST /api/services/:id/:env/stop             stop it
//   GET  /api/services/:id/:env/logs             recent output of a managed pnpm process
//   (everything else) → the built Vite app in web/dist
//
// Bound to localhost only — it can start/stop processes and containers, so it must
// never be exposed on a routable interface. Run with `pnpm dev-portal`.

import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { services, groups, softEdges } from '../services.config.mjs';
import { buildStatus } from './probe.mjs';
import { startService, stopService } from './actions.mjs';
import { processLogs, killAll } from './processManager.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIST = join(__dirname, '..', 'web', 'dist');
const PORT = Number(process.env.DEV_PORTAL_PORT || 4321);
const HOST = '127.0.0.1';

const app = express();
app.use(express.json());

// Validate :id/:env against the registry so route params can never be used to
// build an arbitrary command downstream.
function requireServiceEnv(req, res, next) {
  const svc = services.find((s) => s.id === req.params.id);
  if (!svc) return res.status(404).json({ ok: false, message: `Unknown service "${req.params.id}"` });
  if (!svc.envs.includes(req.params.env)) {
    return res.status(400).json({ ok: false, message: `"${svc.id}" has no "${req.params.env}" environment` });
  }
  req.svc = svc;
  next();
}

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

app.get('/api/status', async (_req, res) => {
  try {
    const live = await buildStatus(services);
    res.set('cache-control', 'no-store');
    res.json({
      generatedAt: live.generatedAt,
      dockerAvailable: live.dockerAvailable,
      groups,
      softEdges,
      services: services.map((s) => ({
        id: s.id, label: s.label, group: s.group, stack: s.stack,
        envs: s.envs, pos: s.pos, dependsOn: s.dependsOn, self: !!s.self,
        actions: Object.fromEntries(Object.entries(s.actions ?? {}).map(([e, a]) => [e, a.kind])),
        status: live.status[s.id],
      })),
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/services/:id/:env/start', requireServiceEnv, async (req, res) => {
  const result = await startService(req.params.id, req.params.env);
  res.status(result.ok ? 200 : 409).json(result);
});

app.post('/api/services/:id/:env/stop', requireServiceEnv, async (req, res) => {
  const result = await stopService(req.params.id, req.params.env);
  res.status(result.ok ? 200 : 409).json(result);
});

app.get('/api/services/:id/:env/logs', requireServiceEnv, (req, res) => {
  const logs = processLogs(req.params.id, req.params.env);
  if (logs === null) {
    return res.status(404).json({ ok: false, message: 'No managed process (Docker services log via `docker compose logs`).' });
  }
  res.json({ ok: true, logs });
});

// ── Static Vite build ──────────────────────────────────────────────────────
if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  const indexHtml = join(WEB_DIST, 'index.html');
  app.get('*', (_req, res) => res.sendFile(indexHtml));
} else {
  app.get('*', (_req, res) =>
    res
      .status(503)
      .type('html')
      .send('<pre>UI not built yet. Run:  pnpm --filter @busmate/dev-portal build\n(or use `pnpm dev-portal` which builds first)</pre>'));
}

const server = app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  BusMate dev-portal  →  http://localhost:${PORT}\n`);
});

// Clean up any pnpm processes we spawned when the portal is stopped.
function shutdown() { killAll(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
