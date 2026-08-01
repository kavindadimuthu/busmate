#!/usr/bin/env node
// with-env.mjs — set environment variables, then run a command.
//
// `FOO=bar cmd` is POSIX shell syntax. pnpm runs package.json scripts through
// cmd.exe on Windows, which parses that as "run a program named FOO=bar" and
// fails. This wrapper does the same job on every platform:
//
//   node scripts/with-env.mjs FOO=bar BAZ=qux -- some-command --flag
//
// Everything before `--` is a KEY=VALUE pair; everything after is the command.
// A local stand-in for `cross-env`, kept in-repo so the toolchain needs no
// extra dependency to be usable on Windows.

import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const separator = argv.indexOf('--');

if (separator === -1) {
  console.error(
    'with-env: missing `--` separator.\n' +
      'Usage: node scripts/with-env.mjs KEY=VALUE [KEY=VALUE ...] -- <command> [args...]'
  );
  process.exit(1);
}

const assignments = argv.slice(0, separator);
const [command, ...args] = argv.slice(separator + 1);

if (!command) {
  console.error('with-env: no command given after `--`.');
  process.exit(1);
}

const env = { ...process.env };
for (const assignment of assignments) {
  const eq = assignment.indexOf('=');
  if (eq < 1) {
    console.error(`with-env: "${assignment}" is not a KEY=VALUE pair.`);
    process.exit(1);
  }
  env[assignment.slice(0, eq)] = assignment.slice(eq + 1);
}

// `shell: true` is required on Windows to resolve the .cmd shims pnpm puts in
// node_modules/.bin. The shell re-parses the whole line, so quote each part and
// pass one string rather than an args array (Node deprecates the latter under
// `shell: true`, since it concatenates without escaping).
const quote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

const result = spawnSync([command, ...args].map(quote).join(' '), {
  stdio: 'inherit',
  shell: true,
  env,
});

if (result.error) {
  console.error(`with-env: failed to run "${command}": ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
