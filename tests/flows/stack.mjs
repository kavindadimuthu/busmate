#!/usr/bin/env node
// A throwaway local stack for the flow tests: a fresh Postgres, user-service, core-service, the gateway and both
// frontends, wired to each other and to nothing else. INC-049.
//
//   node tests/flows/stack.mjs up      start everything (about two minutes the first time)
//   node tests/flows/stack.mjs down    stop everything it started, and remove the database
//   node tests/flows/stack.mjs status  what is listening
//
// Why it is built the way it is (each of these was a real problem):
//  - The services are given explicit SPRING_DATASOURCE_* overrides. config/secrets/.env holds real remote database
//    credentials, and a service that read them would run migrations against them. Nothing here may.
//  - The database is its own container on its own port, never the docker-compose one, whose volume holds your
//    ordinary dev data.
//  - Processes are stopped by the pid this script recorded, in its own process group. Never by a command-line
//    pattern: `pkill -f` matches the shell running it.
//  - Postgres is "ready" when a query works, not when pg_isready says so: it answers pg_isready during its
//    first-boot restart, and databases created then vanish.
//  - The stack owns its gateway, on 8090, and never reuses a running one. user-service signs tokens with a key it
//    generates on every boot and the gateway caches the key set, so a fresh stack behind an older gateway answers
//    every request with 401 until that cache expires. A gateway of its own also leaves the one you develop against
//    alone, and lets the rate limits be raised for tests.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runDir = resolve(root, 'tests/flows/.run');
const pidFile = resolve(runDir, 'pids.json');
const PG = { name: 'busmate-flows-postgres', port: 5544 };
const GATEWAY = 'http://localhost:8090';
const MVN_ARGS = process.env.FLOWS_MVN_OFFLINE === '1' ? ['-o', '-q'] : ['-q'];

const jdbc = (db) => `jdbc:postgresql://localhost:${PG.port}/${db}`;
const dbEnv = (db) => ({
  SPRING_PROFILES_ACTIVE: 'dev',
  SPRING_DATASOURCE_URL: jdbc(db),
  SPRING_DATASOURCE_USERNAME: 'postgres',
  SPRING_DATASOURCE_PASSWORD: 'postgres',
  KAFKA_BOOTSTRAP_SERVERS: 'localhost:9', // there is no broker; the services run without one
});

// Vite lets process env beat the apps' .env files, so pointing both frontends at this stack's gateway needs no change to them.
function frontendEnv() {
  return Object.fromEntries(
    ['VITE_API_GATEWAY_URL', 'VITE_ROUTE_MANAGEMENT_API_URL', 'VITE_USER_MANAGEMENT_API_URL', 'VITE_TICKETING_API_URL', 'VITE_DEV_API_GATEWAY_TARGET']
      .map((k) => [k, GATEWAY]),
  );
}

const SERVICES = [
  {
    name: 'user-service', port: 9020, health: 'http://localhost:9020/actuator/health',
    cwd: 'apps/backend/user-service', cmd: ['./mvnw', ...MVN_ARGS, 'spring-boot:run'],
    env: { ...dbEnv('busmate_user'), SERVER_PORT: '9020', CORE_SERVICE_URL: 'http://localhost:9010' },
  },
  {
    name: 'core-service', port: 9010, health: 'http://localhost:9010/actuator/health',
    cwd: 'apps/backend/core-service', cmd: ['./mvnw', ...MVN_ARGS, 'spring-boot:run'],
    env: {
      ...dbEnv('busmate_core'), SERVER_PORT: '9010',
      AUTH_JWKS_URL: 'http://localhost:9020/public/jwks.json', USER_SERVICE_URL: 'http://localhost:9020',
      // So the promotion list has someone in it after one approval, instead of after ten.
      COMMUNITY_PROMOTION_MIN_APPROVED: '1', COMMUNITY_PROMOTION_MIN_DAYS_ACTIVE: '0',
    },
  },
  {
    name: 'api-gateway', port: 8090, health: `${GATEWAY}/health`,
    cwd: 'apps/backend/api-gateway',
    cmd: ['pnpm', 'exec', 'tsx', '--env-file=../../../config/secrets/.env', 'src/index.ts'],
    env: {
      PORT: '8090',
      ALLOWED_ORIGINS: 'http://localhost:4000,http://localhost:5173',
      RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '1000', // a test that fails against the limiter tests the limiter
    },
  },
  {
    name: 'passenger-web', port: 4000, health: 'http://localhost:4000/',
    cwd: 'apps/frontend/passenger-web', cmd: ['pnpm', 'exec', 'vite', '--port', '4000', '--strictPort'], env: frontendEnv(),
  },
  {
    name: 'new-react-portal', port: 5173, health: 'http://localhost:5173/',
    cwd: 'apps/frontend/new-react-portal', cmd: ['pnpm', 'exec', 'vite', '--port', '5173', '--strictPort'], env: frontendEnv(),
  },
];

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async (url) => { try { return (await fetch(url)).ok; } catch { return false; } };
const portBusy = (port) => sh('ss', ['-ltn']).stdout.split('\n').some((l) => new RegExp(`[:.]${port}\\s`).test(l));

async function waitFor(what, check, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await check()) return;
    await sleep(1000);
  }
  throw new Error(`${what} did not come up within ${seconds}s (see tests/flows/.run/*.log)`);
}

async function start() {
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
  console.log('\nstack is up:\n  passenger-web   http://localhost:4000\n  portal          http://localhost:5173\n  gateway         http://localhost:8090');
}

function stop() {
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
