#!/usr/bin/env node
// Seeds a dev database so every community flow can be looked at without creating any data by hand.
// It uses the real APIs through the gateway (as the dev-seed accounts do), so every state it makes is a state the
// application really produces. Safe to run again: it skips what is already there.
//
//   node scripts/seed-community-showcase.mjs [--api http://localhost:8080]
//
// Needs the dev seed applied (docs/dev-seed-credentials.md) and the backend running. Dev only: it signs in with the
// seeded accounts' known passwords. What it leaves, and where to look, is listed in docs/community-showcase.md.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const api = (process.argv.includes('--api') ? process.argv[process.argv.indexOf('--api') + 1] : process.env.BUSMATE_API) || 'http://localhost:8080';

const ACCOUNTS = {
  mot: ['mot@busmate.test', 'Mot@2026'],
  amara: ['contributor.amara@busmate.test', 'Contributor1@2026'],
  chamara: ['contributor.chamara@busmate.test', 'Contributor2@2026'],
  tharindu: ['steward.tharindu@busmate.test', 'Steward1@2026'],
};

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const tokens = {};

async function raw(method, path, { token, body } = {}, attempt = 0) {
  const res = await fetch(api + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429 && attempt < 6) {
    const wait = Number(res.headers.get('retry-after') ?? 30) + 1;
    console.log(`  rate limited; waiting ${wait}s`);
    await sleep(wait);
    return raw(method, path, { token, body }, attempt + 1);
  }
  if (Number(res.headers.get('ratelimit-remaining') ?? 99) <= 3) await sleep(Number(res.headers.get('ratelimit-reset') ?? 5) + 1);
  const text = await res.text();
  let parsed = text;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* leave as text */ }
  return { status: res.status, body: parsed };
}

async function as(name) {
  if (!tokens[name]) {
    const [email, password] = ACCOUNTS[name];
    const r = await raw('POST', '/api/auth/login', { body: { email, password } });
    if (r.status !== 200) die(`cannot sign in as ${name} (${r.status}) — is the dev seed applied and the backend running at ${api}?`);
    tokens[name] = r.body.accessToken;
  }
  const token = tokens[name];
  return {
    get: (p) => raw('GET', p, { token }),
    post: (p, body) => raw('POST', p, { token, body }),
    put: (p, body) => raw('PUT', p, { token, body }),
  };
}

const items = (b) => (Array.isArray(b) ? b : b?.content ?? []);
const die = (m) => { console.error(`error: ${m}`); process.exit(2); };
const must = (r, what, ok = [200, 201]) => { if (!ok.includes(r.status)) die(`${what} failed: ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const log = (m) => console.log(`  ${m}`);
const today = new Date().toLocaleDateString('en-CA');

async function main() {
  console.log(`Seeding the community showcase into ${api}`);
  const mot = await as('mot');

  // ── the network we hang things on ─────────────────────────────────────────────────────────────────────
  const kandy = items((await mot.get('/api/routes/groups/all')).body).find((g) => g.name === 'Colombo - Kandy');
  if (!kandy) die('the dev seed\'s "Colombo - Kandy" route group is missing');
  const routes = items((await mot.get('/api/routes/all')).body).filter((r) => r.routeGroupId === kandy.id);
  const schedulesOf = async (route) => items((await mot.get(`/api/schedules/by-route/${route.id}`)).body);
  const morning = (await schedulesOf(routes.find((r) => r.name === 'Colombo Fort to Kandy'))).find((s) => s.name === 'Colombo-Kandy Morning Express');
  const afternoon = (await schedulesOf(routes.find((r) => r.name === 'Kandy to Colombo Fort'))).find((s) => s.name === 'Kandy-Colombo Afternoon Express');
  if (!morning || !afternoon) die('the dev seed\'s Colombo–Kandy schedules are missing');
  const [a, b, c] = [morning.scheduleStops[1], morning.scheduleStops[2], morning.scheduleStops[0]];

  // ── 1. a real-shaped community timetable, as reports ─────────────────────────────────────────────────
  const post = resolve(root, 'tests/flows/fixtures/sample-post.txt');
  if (existsSync(post)) {
    const csv = resolve(root, 'scripts/timetable-post/.showcase-departures.csv');
    const env = { ...process.env, BUSMATE_EMAIL: ACCOUNTS.mot[0], BUSMATE_PASSWORD: ACCOUNTS.mot[1], BUSMATE_API: api };
    const run = (args) => execFileSync('node', [resolve(root, 'scripts/timetable-post/import.mjs'), ...args], { env, cwd: root, encoding: 'utf8' });
    run(['parse', '--file', post, '--csv', csv]);
    const out = run(['load', '--csv', csv, '--observed-on', '2025-10-13', '--label', 'Community timetable post (13 Oct 2025)']);
    log(`timetable post: ${out.split('\n').filter((l) => /Schedules|Workings/.test(l)).map((l) => l.trim().replace(/\s+/g, ' ')).join(' | ')}`);
  }

  // ── 2. stop proposals in every state ─────────────────────────────────────────────────────────────────
  const amara = await as('amara');
  const chamara = await as('chamara');
  const steward = await as('tharindu');
  const mine = async (who) => items((await who.get('/api/community/changesets/mine?size=100')).body);
  const titled = (list, title) => list.find((p) => (p.proposedValues?.name ?? p.proposedValues?.operatorNameObserved) === title || p.proposedValues?.description === title);

  const amaraHas = await mine(amara);
  const stopBody = (stop, description) => ({
    targetStopId: stop.stopId, name: stop.stopName, description, location: stop.location, isAccessible: true,
    observedOn: today, observationMethod: 'RODE_THE_ROUTE',
  });
  const newStop = (name, lat, lng) => ({
    name, location: { latitude: lat, longitude: lng, city: 'Kegalle', country: 'Sri Lanka' },
    observedOn: today, observationMethod: 'LIVES_OR_WORKS_NEARBY', note: `Showcase: ${name}`,
  });

  const APPROVED = 'Showcase: an approved correction';
  if (!titled(amaraHas, APPROVED)) {
    const p = must(await amara.post('/api/community/stop-proposals', stopBody(a, APPROVED)), 'propose correction').changeset;
    must(await steward.post(`/api/community/changesets/${p.id}/approve`), 'approve correction');
    log('an approved stop correction (Approved tab)');
  }
  const REVERTED = 'Showcase: an approved correction later undone';
  if (!titled(amaraHas, REVERTED)) {
    const p = must(await amara.post('/api/community/stop-proposals', stopBody(b, REVERTED)), 'propose correction').changeset;
    must(await steward.post(`/api/community/changesets/${p.id}/approve`), 'approve correction');
    must(await mot.post(`/api/community/changesets/${p.id}/revert`), 'revert');
    log('a correction that was approved and then reverted by staff');
  }
  if (!titled(amaraHas, 'Showcase Rejected Stop')) {
    const p = must(await amara.post('/api/community/stop-proposals', newStop('Showcase Rejected Stop', 7.25, 80.35)), 'propose stop').changeset;
    must(await steward.post(`/api/community/changesets/${p.id}/reject`, { reason: 'CANNOT_VERIFY', note: 'Showcase: could not find it on the road.' }), 'reject');
    log('a rejected stop proposal, with the reviewer\'s note');
  }
  if (!titled(amaraHas, 'Showcase Withdrawn Stop')) {
    const p = must(await amara.post('/api/community/stop-proposals', newStop('Showcase Withdrawn Stop', 7.26, 80.36)), 'propose stop').changeset;
    must(await amara.post(`/api/community/changesets/${p.id}/withdraw`), 'withdraw');
    log('a withdrawn stop proposal');
  }
  if (!titled(amaraHas, 'Showcase Pending Stop')) {
    must(await amara.post('/api/community/stop-proposals', newStop('Showcase Pending Stop', 7.27, 80.37)), 'propose stop');
    log('a pending new-stop proposal (for a steward to decide)');
  }

  // ── 3. proposals about who works a departure, in every state ─────────────────────────────────────────
  const working = (scheduleId, operator, plates, extra = {}) => ({
    scheduleId, operatorNameObserved: operator, platesObserved: plates, observedOn: today, observationMethod: 'RODE_THE_ROUTE', ...extra,
  });
  const amaraWork = titled(amaraHas, 'Showcase Pending Travels');
  if (!amaraWork) {
    must(await amara.post('/api/community/working-proposals', working(morning.id, 'Showcase Pending Travels', ['SC-1001', 'SC-1002'], { serviceClass: 'SEMI_LUXURY', note: 'Showcase: seen most mornings.' })), 'propose working');
    log('a pending working proposal on the Colombo–Kandy morning express (waiting for a steward or staff)');
  }
  const chamaraHas = await mine(chamara);
  if (!titled(chamaraHas, 'Showcase Approved Express')) {
    const p = must(await chamara.post('/api/community/working-proposals', working(afternoon.id, 'Showcase Approved Express', ['SC-2001'])), 'propose working');
    must(await steward.post(`/api/community/changesets/${p.id}/approve`), 'approve working');
    log('an approved working: the afternoon express now shows "usually Showcase Approved Express" to passengers');
  }
  if (!titled(chamaraHas, 'Showcase Duplicate Travels')) {
    const p = must(await chamara.post('/api/community/working-proposals', working(afternoon.id, 'Showcase Duplicate Travels', [])), 'propose working');
    must(await steward.post(`/api/community/changesets/${p.id}/reject`, { reason: 'DUPLICATE', note: 'Showcase: already recorded.' }), 'reject working');
    log('a rejected working proposal');
  }

  // ── 4. staff-recorded workings: one current, one ended ───────────────────────────────────────────────
  const existing = (await mot.get(`/api/schedules/${morning.id}/workings`)).body ?? [];
  if (!existing.some((w) => w.operatorNameObserved === 'Showcase Staff Lines')) {
    must(await mot.post(`/api/schedules/${morning.id}/workings`, { operatorNameObserved: 'Showcase Staff Lines', vehicles: [{ plateObserved: 'SC-3001' }] }), 'record working');
    log('a working recorded by staff (Schedule → Usual Workings tab)');
  }
  if (!existing.some((w) => w.operatorNameObserved === 'Showcase Ended Lines')) {
    const w = must(await mot.post(`/api/schedules/${morning.id}/workings`, { operatorNameObserved: 'Showcase Ended Lines', effectiveStartDate: '2026-01-01' }), 'record working');
    must(await mot.put(`/api/schedule-workings/${w.id}/end`, { effectiveEndDate: '2026-06-30' }), 'end working');
    log('a working that has ended');
  }

  console.log('\nDone. See docs/community-showcase.md for who to sign in as and where to look.');
}

main().catch((e) => die(e.stack ?? String(e)));
