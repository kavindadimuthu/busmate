#!/usr/bin/env node
// A throwaway local stack for UI snapshots only: a fresh Postgres, user-service, core-service, the gateway
// and the two web frontends, wired to each other and to nothing else. Deliberately its own ports, distinct
// from both your normal dev stack and the (currently unmerged, INC-049) flow-test stack, so any of the three
// can run at the same time without a port clash.
//
//   node tools/ui-snapshots/stack.mjs up      start everything (about two minutes the first time)
//   node tools/ui-snapshots/stack.mjs down    stop everything it started, and remove the database
//   node tools/ui-snapshots/stack.mjs status  what is listening
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot as root } from './apps.mjs';

const runDir = resolve(root, 'tools/ui-snapshots/.run');
const pidFile = resolve(runDir, 'pids.json');
const PG = { name: 'busmate-snapshots-postgres', port: 5546 };
const GATEWAY = 'http://localhost:8092';
const MVN_ARGS = process.env.SNAPSHOTS_MVN_OFFLINE === '1' ? ['-o', '-q'] : ['-q'];

const jdbc = (db) => `jdbc:postgresql://localhost:${PG.port}/${db}`;
const dbEnv = (db) => ({
  SPRING_PROFILES_ACTIVE: 'dev', // runs the Flyway dev seed automatically (docs/dev-seed-credentials.md)
  SPRING_DATASOURCE_URL: jdbc(db),
  SPRING_DATASOURCE_USERNAME: 'postgres',
  SPRING_DATASOURCE_PASSWORD: 'postgres',
  KAFKA_BOOTSTRAP_SERVERS: 'localhost:9', // there is no broker; the services run without one
});

function frontendEnv() {
  return Object.fromEntries(
    ['VITE_API_GATEWAY_URL', 'VITE_ROUTE_MANAGEMENT_API_URL', 'VITE_USER_MANAGEMENT_API_URL', 'VITE_TICKETING_API_URL', 'VITE_DEV_API_GATEWAY_TARGET']
      .map((k) => [k, GATEWAY]),
  );
}

const SERVICES = [
  {
    name: 'user-service', port: 9022, health: 'http://localhost:9022/actuator/health',
    cwd: 'apps/backend/user-service', cmd: ['./mvnw', ...MVN_ARGS, 'spring-boot:run'],
    env: { ...dbEnv('busmate_user'), SERVER_PORT: '9022', CORE_SERVICE_URL: 'http://localhost:9012' },
  },
  {
    name: 'core-service', port: 9012, health: 'http://localhost:9012/actuator/health',
    cwd: 'apps/backend/core-service', cmd: ['./mvnw', ...MVN_ARGS, 'spring-boot:run'],
    env: { ...dbEnv('busmate_core'), SERVER_PORT: '9012', AUTH_JWKS_URL: 'http://localhost:9022/public/jwks.json', USER_SERVICE_URL: 'http://localhost:9022' },
  },
  {
    name: 'api-gateway', port: 8092, health: `${GATEWAY}/health`,
    cwd: 'apps/backend/api-gateway',
    cmd: ['pnpm', 'exec', 'tsx', '--env-file=../../../config/secrets/.env', 'src/index.ts'],
    env: {
      PORT: '8092', ALLOWED_ORIGINS: 'http://localhost:4002,http://localhost:5175', RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '1000',
      // config/secrets/.env's defaults point at the normal dev ports; this stack's services run on its own ports.
      USER_SERVICE_URL: 'http://localhost:9022', CORE_SERVICE_URL: 'http://localhost:9012',
    },
  },
  {
    name: 'passenger-web', port: 4002, health: 'http://localhost:4002/',
    cwd: 'apps/frontend/passenger-web', cmd: ['pnpm', 'exec', 'vite', '--port', '4002', '--strictPort'], env: frontendEnv(),
  },
  {
    name: 'new-react-portal', port: 5175, health: 'http://localhost:5175/',
    cwd: 'apps/frontend/new-react-portal', cmd: ['pnpm', 'exec', 'vite', '--port', '5175', '--strictPort'], env: frontendEnv(),
  },
];

export const BASE_URLS = { 'passenger-web': 'http://localhost:4002', 'new-react-portal': 'http://localhost:5175' };

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async (url) => { try { return (await fetch(url)).ok; } catch { return false; } };
const portBusy = (port) => sh('ss', ['-ltn']).stdout.split('\n').some((l) => new RegExp(`[:.]${port}\\s`).test(l));

async function waitFor(what, check, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await check()) return;
    await sleep(1000);
  }
  throw new Error(`${what} did not come up within ${seconds}s (see tools/ui-snapshots/.run/*.log)`);
}

export async function start() {
  if (existsSync(pidFile)) throw new Error('a stack is already recorded as running; run `down` first');
  if (sh('docker', ['info']).status !== 0) throw new Error('docker is not available');
  if (!existsSync(resolve(root, 'config/secrets/.env'))) {
    throw new Error('config/secrets/.env is missing (the gateway needs it); copy config/secrets/.env.example');
  }
  for (const s of SERVICES) {
    if (portBusy(s.port)) throw new Error(`port ${s.port} (${s.name}) is already in use; stop it, this stack must own it`);
  }
  if (portBusy(PG.port)) throw new Error(`port ${PG.port} is in use`);
  mkdirSync(runDir, { recursive: true });

  console.log(`postgres on :${PG.port}`);
  sh('docker', ['rm', '-f', PG.name]);
  const run = sh('docker', ['run', '-d', '--name', PG.name, '-p', `${PG.port}:5432`,
    '-e', 'POSTGRES_USER=postgres', '-e', 'POSTGRES_PASSWORD=postgres', 'postgres:16-alpine']);
  if (run.status !== 0) throw new Error(`could not start postgres: ${run.stderr}`);
  const query = (q) => sh('docker', ['exec', PG.name, 'psql', '-U', 'postgres', '-tAc', q]);
  await waitFor('postgres', () => query('select 1').status === 0, 60);
  await sleep(3000); // it restarts once after first boot; wait that out before creating databases
  await waitFor('postgres (after restart)', () => query('select 1').status === 0, 30);
  for (const db of ['busmate_user', 'busmate_core']) {
    if (query(`create database ${db}`).status !== 0) throw new Error(`could not create ${db}`);
  }

  const pids = {};
  for (const s of SERVICES) {
    const log = openSync(resolve(runDir, `${s.name}.log`), 'w');
    const child = spawn(s.cmd[0], s.cmd.slice(1), {
      cwd: resolve(root, s.cwd), env: { ...process.env, ...s.env }, stdio: ['ignore', log, log], detached: true,
    });
    child.unref();
    pids[s.name] = child.pid;
    writeFileSync(pidFile, JSON.stringify({ pids }));
    console.log(`${s.name}: starting on :${s.port}`);
  }
  writeFileSync(pidFile, JSON.stringify({ pids }));

  for (const s of SERVICES) await waitFor(s.name, () => up(s.health), 240);
  console.log('\nstack is up:\n  passenger-web   http://localhost:4002\n  portal          http://localhost:5175\n  gateway         http://localhost:8092');
}

export function stop() {
  if (existsSync(pidFile)) {
    const { pids } = JSON.parse(readFileSync(pidFile, 'utf8'));
    for (const [name, pid] of Object.entries(pids)) {
      try { process.kill(-pid, 'SIGTERM'); console.log(`stopped ${name}`); } catch { /* already gone */ }
    }
    rmSync(pidFile);
  }
  sh('docker', ['rm', '-f', PG.name]);
  console.log('removed the throwaway database');
}

async function status() {
  for (const s of SERVICES) console.log(`${(await up(s.health)) ? 'up  ' : 'down'}  ${s.name.padEnd(17)} :${s.port}`);
  console.log(`${sh('docker', ['ps', '--filter', `name=${PG.name}`, '--format', '{{.Names}}']).stdout.trim() ? 'up  ' : 'down'}  ${PG.name.padEnd(17)} :${PG.port}`);
}

const command = process.argv[2];
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    if (command === 'up') await start();
    else if (command === 'down') stop();
    else if (command === 'status') await status();
    else { console.error('usage: stack.mjs up|down|status'); process.exit(2); }
  } catch (e) {
    console.error(`error: ${e.message}`);
    if (command === 'up') { console.error('cleaning up what was started'); stop(); }
    process.exit(1);
  }
}
