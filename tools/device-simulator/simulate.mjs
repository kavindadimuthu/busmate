#!/usr/bin/env node
// Device simulator (IoT Platform Layer plan, Phase 2) — replays a bus moving along a route,
// POSTing real location fixes to the ingest endpoint. This is the load-test and demo rig the
// plan calls out explicitly: it exercises the exact same pipeline a real GPS tracker or the
// conductor app will use, with zero hardware.
//
// Usage:
//   node tools/device-simulator/simulate.mjs [--route=colombo-kandy] [--token=bmt_...]
//     [--gateway=http://localhost:8080] [--interval=10] [--speed=1]
//
// Defaults to one of the seeded demo device tokens (see docs/dev-iot-device-credentials.md) for
// the Colombo–Kandy demo route, so `node tools/device-simulator/simulate.mjs` works out of the
// box against a freshly-seeded dev stack — no flags required.
//
// --interval: seconds between fixes (default 10)
// --speed: playback speed multiplier — 1 = realistic bus pace (~50km/h between waypoints),
//          higher values compress the whole route into a shorter demo run.

import { ROUTES } from './routes.mjs';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) args[match[1]] = match[2] ?? true;
  }
  return args;
}

const args = parseArgs(process.argv);

const GATEWAY_URL = args.gateway || process.env.SIMULATOR_GATEWAY_URL || 'http://localhost:8080';
const TOKEN = args.token || process.env.SIMULATOR_DEVICE_TOKEN || 'bmt_devseed_01_813de247c3b1f239c4d5e955';
const ROUTE_NAME = args.route || 'colombo-kandy';
const INTERVAL_SECONDS = Number(args.interval || 10);
const SPEED_MULTIPLIER = Number(args.speed || 1);
const LOOP = args.loop !== undefined ? args.loop !== 'false' : true;

const route = ROUTES[ROUTE_NAME];
if (!route) {
  console.error(`Unknown route "${ROUTE_NAME}". Available: ${Object.keys(ROUTES).join(', ')}`);
  process.exit(1);
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearingDegrees(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function lerp(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Builds a flat list of {lat,lng,speedKmh,headingDeg} fixes spaced INTERVAL_SECONDS apart along the route. */
function buildFixes(waypoints) {
  const AVERAGE_SPEED_KMH = 50;
  const fixes = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const distanceM = haversineMeters(from, to);
    const heading = bearingDegrees(from, to);
    const legSeconds = (distanceM / 1000 / AVERAGE_SPEED_KMH) * 3600 / SPEED_MULTIPLIER;
    const steps = Math.max(1, Math.round(legSeconds / INTERVAL_SECONDS));

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const point = lerp(from, to, t);
      fixes.push({ ...point, speedKmh: AVERAGE_SPEED_KMH, headingDeg: heading });
    }
  }
  fixes.push({ ...waypoints[waypoints.length - 1], speedKmh: 0, headingDeg: 0 });
  return fixes;
}

async function postFix(fix, sequenceNo) {
  const body = {
    deviceTimestamp: new Date().toISOString(),
    sequenceNo,
    payload: {
      lat: Number(fix.lat.toFixed(6)),
      lng: Number(fix.lng.toFixed(6)),
      speedKmh: fix.speedKmh,
      headingDeg: Number(fix.headingDeg.toFixed(1)),
      accuracyM: 8,
    },
  };

  const res = await fetch(`${GATEWAY_URL}/ingest/v1/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const label = `[#${sequenceNo}] (${body.payload.lat}, ${body.payload.lng}) @ ${body.payload.speedKmh}km/h`;
  if (res.ok) {
    console.log(`✓ ${label} -> ${res.status} ${text}`);
  } else {
    console.error(`✗ ${label} -> ${res.status} ${text}`);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log(`Device simulator: route=${ROUTE_NAME} gateway=${GATEWAY_URL} interval=${INTERVAL_SECONDS}s speed=${SPEED_MULTIPLIER}x loop=${LOOP}`);
  const fixes = buildFixes(route.waypoints);
  console.log(`${fixes.length} fixes across ${route.waypoints.length} waypoints (${route.name}).`);

  let sequenceNo = 0;
  do {
    for (const fix of fixes) {
      await postFix(fix, sequenceNo++);
      await sleep(INTERVAL_SECONDS * 1000);
    }
  } while (LOOP);
}

run().catch((err) => {
  console.error('Simulator crashed:', err);
  process.exit(1);
});
