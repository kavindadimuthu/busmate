// Dev-portal server: a tiny zero-dependency Node HTTP server that
//   - serves the ReactFlow dashboard from ../web
//   - exposes GET /api/status  → live running-status for the whole registry
//   - exposes GET /api/ping     → liveness (so the dashboard can probe itself)
//
// Run it with `pnpm dev-portal` from the repo root, then open the printed URL.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { services, groups, softEdges } from '../services.config.mjs';
import { buildStatus } from './probe.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = join(__dirname, '..', 'web');
const PORT = Number(process.env.DEV_PORTAL_PORT || 4321);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(payload);
}

async function serveStatic(res, urlPath) {
  // Resolve within WEB_DIR only — reject any traversal outside it.
  const rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(WEB_DIR, rel === '/' || rel === '' ? 'index.html' : rel);
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/ping') {
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/status') {
    try {
      const live = await buildStatus(services);
      // Ship the registry alongside status so the browser has everything it
      // needs to draw the graph in one request.
      return sendJson(res, 200, {
        generatedAt: live.generatedAt,
        dockerAvailable: live.dockerAvailable,
        groups,
        softEdges,
        services: services.map((s) => ({
          id: s.id, label: s.label, group: s.group, stack: s.stack,
          envs: s.envs, position: s.position, dependsOn: s.dependsOn, self: !!s.self,
          status: live.status[s.id],
        })),
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || err) });
    }
  }

  return serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  BusMate dev-portal  →  http://localhost:${PORT}\n`);
});
