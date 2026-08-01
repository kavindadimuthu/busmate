#!/usr/bin/env node
// mvnw.mjs — run a Spring Boot service's Maven Wrapper on any platform.
//
//   node scripts/mvnw.mjs apps/backend/user-service clean package -DskipTests
//
// The first argument is the service directory, relative to the repo root; the
// rest are passed straight to Maven.
//
// Why this exists: `./mvnw` only works in a POSIX shell. pnpm runs scripts
// through cmd.exe on Windows, which reads the `/` in `./mvnw` as a switch
// delimiter and reports "'.' is not recognized as an internal or external
// command". Maven ships both wrappers (`mvnw` and `mvnw.cmd`) — this picks the
// right one, so every script and Nx target can use a single spelling.

import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

const [serviceDir, ...mavenArgs] = process.argv.slice(2);

if (!serviceDir) {
  console.error(
    'mvnw: missing service directory.\n' +
      'Usage: node scripts/mvnw.mjs <service-dir> [maven args...]\n' +
      'Example: node scripts/mvnw.mjs apps/backend/user-service clean package -DskipTests'
  );
  process.exit(1);
}

const cwd = resolve(repoRoot, serviceDir);

if (!existsSync(join(cwd, 'pom.xml'))) {
  console.error(`mvnw: no pom.xml in "${serviceDir}" — is that the right service directory?`);
  process.exit(1);
}

const wrapper = join(cwd, isWindows ? 'mvnw.cmd' : 'mvnw');

if (!existsSync(wrapper)) {
  console.error(`mvnw: Maven Wrapper not found at ${wrapper}`);
  process.exit(1);
}

// A clone made on Windows, or a copy through a filesystem that drops the
// executable bit, leaves `mvnw` unrunnable on Linux/macOS. Fall back to
// invoking it through `sh` rather than failing with a bare EACCES.
let command = wrapper;
let args = mavenArgs;

if (!isWindows) {
  try {
    accessSync(wrapper, constants.X_OK);
  } catch {
    command = 'sh';
    args = [wrapper, ...mavenArgs];
  }
}

// `shell: true` is required on Windows, where mvnw.cmd is a batch file that
// Node cannot spawn directly. The shell re-parses the whole line, so quote each
// part and pass one string rather than an args array (Node deprecates the
// latter under `shell: true`, since it concatenates without escaping).
const quote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

const result = spawnSync([command, ...args].map(quote).join(' '), {
  cwd,
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error(`mvnw: failed to run ${command}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
