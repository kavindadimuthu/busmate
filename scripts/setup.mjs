#!/usr/bin/env node
// setup.mjs — one-time local bootstrap, run via `pnpm run setup`.
//
// Creates the gitignored files a fresh clone needs but git cannot carry, and
// reports on the toolchain. Safe to re-run: nothing here overwrites a file that
// already exists.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

let hasWarnings = false;

const ok = (msg) => console.log(`  ok    ${msg}`);
const warn = (msg) => {
  hasWarnings = true;
  console.log(`  warn  ${msg}`);
};

console.log('\nBusMate local setup\n');

// ── Secrets file ───────────────────────────────────────────────────────────
// config/secrets/.env is gitignored; only the .example template is committed.
const envTarget = resolve(repoRoot, 'config/secrets/.env');
const envTemplate = resolve(repoRoot, 'config/secrets/.env.example');

if (existsSync(envTarget)) {
  ok('config/secrets/.env already exists');
} else if (existsSync(envTemplate)) {
  copyFileSync(envTemplate, envTarget);
  warn('created config/secrets/.env from .env.example — fill in the real values');
} else {
  warn('config/secrets/.env.example is missing; cannot create config/secrets/.env');
}

// ── Local-dev secrets ──────────────────────────────────────────────────────
// These two only need to be *some* sufficiently strong shared value locally —
// every backend service reads this one file, so a generated value is consistent
// across them. Left as `<placeholder>` text they break startup rather than
// falling back: SUPABASE_JWT_SECRET is used directly as an HMAC-SHA key and the
// placeholder is under the 256-bit minimum RFC 7518 requires.
//
// Only ever fills in values still set to a `<...>` placeholder, so a real
// secret is never overwritten and re-running this is safe.
const GENERATED_SECRETS = ['SUPABASE_JWT_SECRET', 'INTERNAL_API_KEY'];

if (existsSync(envTarget)) {
  let contents = readFileSync(envTarget, 'utf8');
  const filled = [];

  for (const key of GENERATED_SECRETS) {
    const placeholder = new RegExp(`^(${key}=)<[^>\\n]*>[ \\t]*$`, 'm');
    if (placeholder.test(contents)) {
      contents = contents.replace(placeholder, `$1${randomBytes(48).toString('base64url')}`);
      filled.push(key);
    }
  }

  if (filled.length > 0) {
    writeFileSync(envTarget, contents);
    ok(`generated local-dev values for ${filled.join(', ')}`);
  }

  // Anything still on a placeholder is an external credential we cannot invent.
  const remaining = [...contents.matchAll(/^([A-Z0-9_]+)=<[^>\n]*>[ \t]*$/gm)].map((m) => m[1]);
  if (remaining.length > 0) {
    warn(
      `still placeholders in config/secrets/.env: ${remaining.join(', ')} — ` +
        'fill these in for any feature that needs them'
    );
  }
}

// ── Toolchain checks ───────────────────────────────────────────────────────
const probe = (commandLine) => {
  const result = spawnSync(commandLine, { encoding: 'utf8', shell: true });
  if (result.status !== 0) return null;
  return `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n')[0];
};

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 20) ok(`Node ${process.versions.node}`);
else warn(`Node ${process.versions.node} — the workspace requires >= 20`);

const java = probe('java -version');
if (java) ok(`Java: ${java}`);
else warn('Java not found — JDK 17 is required for the Spring Boot services');

const docker = probe('docker --version');
if (docker) ok(docker);
else warn('Docker not found — required for Postgres and the containerised backend');

// The seed and e2e-env helpers are bash scripts invoked explicitly as
// `bash <script>`, so Windows needs Git Bash (or WSL) on PATH. Git for Windows
// installs bash but does not always add it, so point at it when it is there.
if (isWindows) {
  const bash = probe('bash --version');
  if (bash) {
    ok(`bash available: ${bash}`);
  } else if (existsSync('C:\\Program Files\\Git\\bin\\bash.exe')) {
    warn(
      'bash is installed with Git for Windows but is not on PATH — add ' +
        '"C:\\Program Files\\Git\\bin" to PATH to run the seed/e2e scripts'
    );
  } else {
    warn('bash not found on PATH — install Git for Windows to run the seed/e2e scripts');
  }
}

console.log(
  hasWarnings
    ? '\nSetup finished with warnings — resolve them before running the platform.\n'
    : '\nSetup complete.\n'
);
