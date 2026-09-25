#!/usr/bin/env node
// Loads a community bus-timetable post into BusMate as reports. INC-048, ADR-024, ADR-025.
//
//   1. node scripts/timetable-post/import.mjs parse --file post.txt --csv departures.csv
//        Reads the post and writes one row per departure. Open the CSV in a spreadsheet and check it first.
//   2. BUSMATE_EMAIL=… BUSMATE_PASSWORD=… node scripts/timetable-post/import.mjs load --csv departures.csv \
//        --observed-on 2025-10-13 --label "Community timetable post (13 Oct 2025)" [--api http://localhost:8080] [--dry-run]
//        Loads exactly the rows in that CSV, through the same API staff use, as MOT or ADMIN.
//
// Everything is recorded as a report (SRC_5) dated to the post, credited to it — never as BusMate's own
// observation. Community times go in the *unverified* columns (ADR-018), so no trips are ever generated from
// them. Nothing is guessed: no coordinates, no service class the post does not state, and no operating days
// unless the post states them. It is safe to run twice: what exists is skipped.
import { readFileSync, writeFileSync } from 'node:fs';
import { fromCsv, parsePost, STOPS, toCsv } from './parse.mjs';

const args = Object.fromEntries(
  process.argv.slice(3).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]]] : acc), []),
);
const command = process.argv[2];

function parseCommand() {
  if (!args.file || !args.csv) fail('parse needs --file <post.txt> and --csv <departures.csv>');
  const result = parsePost(readFileSync(args.file, 'utf8'));
  writeFileSync(args.csv, toCsv(result.departures));

  const bySection = {};
  result.departures.forEach((d) => (bySection[d.routeName] = (bySection[d.routeName] ?? 0) + 1));
  console.log(`Read ${result.departures.length} departures into ${args.csv}:`);
  Object.entries(bySection).forEach(([name, n]) => console.log(`  ${String(n).padStart(3)}  ${name}`));
  const skipped = result.skippedSections.reduce((n, s) => n + s.lines, 0);
  console.log(`\nNot read: ${result.skippedSections.length} other sections, ${skipped} departure lines`);
  result.skippedSections.forEach((s) => console.log(`  ${String(s.lines).padStart(3)}  ${s.header.slice(0, 70)}`));
  console.log(`Ignored on purpose: ${result.ignored.bookingLines} booking-contact lines, ${result.ignored.continuationLines} explanatory notes`);
  if (result.problems.length) {
    console.log(`\n${result.problems.length} lines could not be read:`);
    result.problems.forEach((p) => console.log(`  line ${p.line}: ${p.problem} — ${p.text}`));
    process.exitCode = 1;
  }
}

// ── loading ──────────────────────────────────────────────────────────────────────────────────────────────

async function loadCommand() {
  if (!args.csv || !args['observed-on'] || !args.label) fail('load needs --csv, --observed-on <YYYY-MM-DD> and --label "<source>"');
  const dryRun = args['dry-run'] === true;
  const base = args.api || process.env.BUSMATE_API || 'http://localhost:8080';
  const observedOn = args['observed-on'];
  const label = args.label;
  const rows = fromCsv(readFileSync(args.csv, 'utf8'));
  console.log(`${dryRun ? '[dry run] ' : ''}${rows.length} departures from ${args.csv} → ${base}`);
  if (dryRun) return summarise(rows);

  const token = await login(base);
  // The gateway allows a limited number of requests a minute and says how many are left and when it resets, so
  // slow down before the limit rather than fail against it, and if it is hit anyway, wait as told and retry.
  const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const call = async (method, path, body, attempt = 0) => {
    const res = await fetch(base + path, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get('retry-after') ?? 30) + 1;
      console.log(`  rate limited; waiting ${wait}s`);
      await sleep(wait);
      return call(method, path, body, attempt + 1);
    }
    const remaining = Number(res.headers.get('ratelimit-remaining') ?? 99);
    if (remaining <= 3) await sleep(Number(res.headers.get('ratelimit-reset') ?? 5) + 1);
    const text = await res.text();
    return { status: res.status, body: text ? safeJson(text) : null };
  };
  const provenance = { sourceTier: 'SRC_5', observedOn, attributionLabel: label };
  const tally = { stops: [0, 0], routes: [0, 0], schedules: [0, 0, 0], workings: [0, 0, 0] }; // created, failed, already there
  const failures = [];

  const list = async (path) => {
    const r = await call('GET', path);
    return Array.isArray(r.body) ? r.body : r.body?.content ?? [];
  };
  const existingStops = new Map((await list('/api/stops/all')).map((s) => [s.name, s.id]));
  const existingRoutes = new Map((await list('/api/routes/all')).map((r) => [r.name, r.id]));

  const stopIds = {};
  for (const key of new Set(rows.flatMap((r) => [r.originKey, r.destinationKey]))) {
    const def = STOPS[key];
    if (existingStops.has(def.name)) { stopIds[key] = existingStops.get(def.name); tally.stops[1]++; continue; }
    // No coordinates: the post gives none, and a wrong pin is worse than none. A steward can add a position later.
    const r = await call('POST', '/api/stops', {
      name: def.name, nameSinhala: def.nameSinhala,
      location: { city: def.city, citySinhala: def.citySinhala, country: 'Sri Lanka' },
      ...provenance,
    });
    if (r.status !== 201) fail(`could not create stop ${def.name}: ${r.status} ${JSON.stringify(r.body)}`);
    stopIds[key] = r.body.id; tally.stops[0]++;
  }

  const routeIds = {};
  for (const row of rows) {
    if (routeIds[row.sectionKey]) continue;
    if (existingRoutes.has(row.routeName)) { routeIds[row.sectionKey] = existingRoutes.get(row.routeName); tally.routes[1]++; continue; }
    const r = await call('POST', '/api/routes', {
      name: row.routeName, routeNumber: row.routeNumber, roadType: row.roadType, direction: row.direction,
      startStopId: stopIds[row.originKey], endStopId: stopIds[row.destinationKey],
      ...(row.distanceKm ? { distanceKm: Number(row.distanceKm) } : {}),
      ...(row.estimatedDurationMinutes ? { estimatedDurationMinutes: Number(row.estimatedDurationMinutes) } : {}),
      // The post names only the endpoints, and its own fare table names towns between them: more stops exist.
      stopListCompleteness: 'PARTIAL',
      ...provenance,
    });
    if (r.status !== 201) fail(`could not create route ${row.routeName}: ${r.status} ${JSON.stringify(r.body)}`);
    routeIds[row.sectionKey] = r.body.id; tally.routes[0]++;
  }

  for (const row of rows) {
    const time = `${row.departureTime}:00`;
    // A calendar only where the post states days. Where it says nothing, none is recorded — search then shows the
    // departure every day without anything claiming it runs on one — and the description says so plainly.
    const days = row.sundayExcluded
      ? { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }
      : null;
    const schedule = await call('POST', '/api/schedules/full', {
      name: row.scheduleName, routeId: routeIds[row.sectionKey], scheduleType: 'REGULAR', status: 'ACTIVE',
      effectiveStartDate: observedOn, timingCompleteness: 'ORIGIN_ONLY',
      description: describe(row, label),
      // Only the departure from the first stop, and in the unverified column: a community time is never authoritative.
      scheduleStops: [{ stopId: stopIds[row.originKey], stopOrder: 1, departureTimeUnverified: time, departureTimeUnverifiedBy: label }],
      ...(days ? { calendar: days } : {}), exceptions: [],
      ...provenance,
    });
    let scheduleId;
    if (schedule.status === 201) {
      tally.schedules[0]++;
      scheduleId = schedule.body.id;
    } else if (schedule.status === 409) {
      tally.schedules[1]++;
      // Already loaded, perhaps by an earlier run that stopped before its working was written: find it.
      const known = await list(`/api/schedules/by-route/${routeIds[row.sectionKey]}`);
      scheduleId = known.find((s) => s.name === row.scheduleName)?.id;
      if (!scheduleId) { failures.push(`${row.scheduleName}: exists but could not be found again`); continue; }
    } else {
      tally.schedules[2]++;
      failures.push(`${row.scheduleName}: ${schedule.status} ${JSON.stringify(schedule.body).slice(0, 160)}`);
      continue;
    }

    if ((await list(`/api/schedules/${scheduleId}/workings`)).length > 0) { tally.workings[2]++; continue; }
    const working = await call('POST', `/api/schedules/${scheduleId}/workings`, {
      operatorNameObserved: row.operatorName,
      ...(row.serviceClass ? { serviceClass: row.serviceClass } : {}),
      effectiveStartDate: observedOn,
      vehicles: row.plates.map((plateObserved) => ({ plateObserved })),
      ...provenance,
    });
    if (working.status === 201) tally.workings[0]++;
    else { tally.workings[1]++; failures.push(`${row.scheduleName} (working): ${working.status} ${JSON.stringify(working.body).slice(0, 160)}`); }
  }

  console.log(`\nStops      created ${tally.stops[0]}, already there ${tally.stops[1]}`);
  console.log(`Routes     created ${tally.routes[0]}, already there ${tally.routes[1]}`);
  console.log(`Schedules  created ${tally.schedules[0]}, already there ${tally.schedules[1]}, failed ${tally.schedules[2]}`);
  console.log(`Workings   created ${tally.workings[0]}, already there ${tally.workings[2]}, failed ${tally.workings[1]}`);
  if (failures.length) {
    console.log(`\n${failures.length} failures (first 8):`);
    failures.slice(0, 8).forEach((f) => console.log(`  ${f}`));
    process.exitCode = 1;
  }
}

/** The schedule's description: what the post said, and — plainly — what it did not and we assumed. */
function describe(row, label) {
  const parts = [`From the ${label}.`];
  row.notes.forEach((n) => parts.push(`Post note: ${n}.`));
  if (row.rotation) parts.push('Alternates between the listed vehicles.');
  parts.push(row.sundayExcluded ? 'Not on Sundays, as the post states.' : 'Operating days are not stated in the post, so none are recorded.');
  return parts.join(' ');
}

function summarise(rows) {
  const routes = new Set(rows.map((r) => r.routeName));
  const unstated = rows.filter((r) => !r.sundayExcluded).length;
  console.log(`  ${routes.size} routes, ${rows.length} schedules and workings`);
  console.log(`  ${unstated} lines state no days: they get NO calendar (shown every day, nothing claimed); ${rows.length - unstated} say "except Sunday" and get an explicit one`);
  console.log(`  ${rows.filter((r) => r.rotation).length} rotations, ${rows.filter((r) => r.serviceClass).length} with a stated service class`);
}

async function login(base) {
  const { BUSMATE_EMAIL: email, BUSMATE_PASSWORD: password } = process.env;
  if (!email || !password) fail('set BUSMATE_EMAIL and BUSMATE_PASSWORD (an MOT or ADMIN account)');
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get('retry-after') ?? 30) + 1;
      console.log(`  rate limited at login; waiting ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) fail(`login failed: ${res.status}`);
    return (await res.json()).accessToken;
  }
}

const safeJson = (t) => { try { return JSON.parse(t); } catch { return t; } };
function fail(message) { console.error(`error: ${message}`); process.exit(2); }

if (command === 'parse') parseCommand();
else if (command === 'load') await loadCommand();
else fail('usage: import.mjs parse|load  (see the comment at the top of this file)');
