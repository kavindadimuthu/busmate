import { existsSync, readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import type { GatewayClient } from './gateway.ts';
import { BadRequest, type Runner } from './runner.ts';
import { parseControl } from './validate.ts';

const MAX_BODY_BYTES = 16 * 1024;
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

/**
 * The console's only backend: state as server-sent events, one endpoint for controls, and the route
 * list. Serves the built console too, so after `build` one process is the whole tool.
 */
export function createHttpServer(runner: Runner, gateway: GatewayClient, staticDir: string): Server {
  return createServer((req, res) => {
    handle(req, res).catch((error) => {
      if (!res.headersSent) sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      else res.end();
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      const unsubscribe = runner.subscribe({
        state: (s) => send('state', s),
        session: (s) => send('session', s),
        log: (e) => send('log', e),
      });
      req.on('close', unsubscribe);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/routes') {
      try {
        sendJson(res, 200, await gateway.listRoutes());
      } catch (error) {
        sendJson(res, 502, { error: `could not list routes: ${error instanceof Error ? error.message : error}` });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/control') {
      let body: unknown;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        sendJson(res, 400, { error: 'body must be JSON' });
        return;
      }
      const request = parseControl(body);
      if (typeof request === 'string') {
        sendJson(res, 400, { error: request });
        return;
      }
      try {
        await runner.control(request);
        res.writeHead(204).end();
      } catch (error) {
        if (error instanceof BadRequest) sendJson(res, 400, { error: error.message });
        else throw error;
      }
      return;
    }

    if (req.method === 'GET') {
      serveStatic(url.pathname, res);
      return;
    }
    sendJson(res, 404, { error: 'not found' });
  }

  function serveStatic(pathname: string, res: ServerResponse): void {
    const root = resolve(staticDir);
    if (!existsSync(join(root, 'index.html'))) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Console not built. Run `pnpm --filter @busmate/bus-simulator dev` for the dev console, or `build` first.');
      return;
    }
    const candidate = resolve(root, normalize(`.${pathname}`));
    // Anything outside the build directory, or not a file in it, falls back to the app shell.
    const file = candidate.startsWith(root + sep) && existsSync(candidate) && extname(candidate) ? candidate : join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
