#!/usr/bin/env node
// One command for the flow tests: a fresh stack, every spec, and the stack removed again whatever happened.
// The specs are ordered and change the database (someone is accepted, a stop is renamed), so a run needs a
// stack nobody has run against. Extra arguments go to Playwright: `pnpm flows -- specs/timetable-import.spec.ts`.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const stack = (cmd) => spawnSync('node', [resolve(here, 'stack.mjs'), cmd], { stdio: 'inherit', cwd: root });

stack('down'); // clears anything a crashed run left behind
let status = 1;
try {
  if (stack('up').status !== 0) process.exit(1);
  status = spawnSync('pnpm', ['exec', 'playwright', 'test', '-c', 'tests/flows/playwright.config.ts', ...process.argv.slice(2)], {
    stdio: 'inherit', cwd: root,
  }).status ?? 1;
} finally {
  stack('down');
}
process.exit(status);
