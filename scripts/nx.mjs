#!/usr/bin/env node
// nx.mjs — run Nx with this workspace's required environment.
//
//   node scripts/nx.mjs run-many -t build
//
// The daemon and plugin isolation are both disabled workspace-wide: they were
// unstable against this repo's mix of Vite, Expo and Maven projects. Those
// settings used to be repeated as a `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`
// prefix on every script, which is POSIX-only syntax and fails under the
// cmd.exe that pnpm uses on Windows. Setting them here keeps the scripts short
// and gives one place to change them.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Resolve the workspace's own Nx shim rather than relying on `node_modules/.bin`
// being on PATH — that only holds when pnpm invokes us, not when an Nx target or
// a developer runs this script directly.
const localNx = join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'nx.CMD' : 'nx');
const nx = existsSync(localNx) ? localNx : 'nx';

// `shell: true` is required to run the .cmd shim on Windows; it re-parses the
// whole line, so quote each part and pass one string rather than an args array
// (Node deprecates the latter under `shell: true`).
const quote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

const result = spawnSync([nx, ...process.argv.slice(2)].map(quote).join(' '), {
  stdio: 'inherit',
  shell: true,
  cwd: repoRoot,
  env: { ...process.env, NX_DAEMON: 'false', NX_ISOLATE_PLUGINS: 'false' },
});

if (result.error) {
  console.error(`nx: failed to run: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
