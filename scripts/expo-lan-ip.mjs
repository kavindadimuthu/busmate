#!/usr/bin/env node
// expo-lan-ip.mjs — run an Expo command with REACT_NATIVE_PACKAGER_HOSTNAME set to this
// machine's actual LAN IP, detected fresh on every run.
//
// Without this, Expo's dev client falls back to 10.0.2.2 (the Android EMULATOR's loopback
// alias) when it can't establish an adb-reverse tunnel - which silently breaks Metro/bundle
// loading for any real device testing over Wi-Fi instead of USB (see INC-008's "Discovered
// during the work": this exact failure mode, and INC-007 before it hitting the same class of
// problem via a stale committed .env IP). Detecting the IP fresh each run means this can't go
// stale the way a hardcoded IP in .env or app.json would the next time this machine's address
// changes (new network, DHCP lease, etc.).
//
// Usage: node scripts/expo-lan-ip.mjs -- expo start
//        node scripts/expo-lan-ip.mjs -- expo run:android

import { spawnSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const argv = process.argv.slice(2);
const separator = argv.indexOf('--');
if (separator === -1) {
  console.error('expo-lan-ip: missing `--` separator.\nUsage: node scripts/expo-lan-ip.mjs -- <command> [args...]');
  process.exit(1);
}
const [command, ...args] = argv.slice(separator + 1);

function detectLanIp() {
  const interfaces = networkInterfaces();
  const candidates = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      // Deprioritize Docker/virtual bridges (172.17.x/172.18.x here) - a real Wi-Fi/Ethernet
      // adapter is what a phone on the same network can actually reach.
      const isLikelyVirtual = /^(docker|br-|veth|virbr)/.test(name) || addr.address.startsWith('172.1');
      candidates.push({ address: addr.address, isLikelyVirtual });
    }
  }
  const real = candidates.find((c) => !c.isLikelyVirtual);
  return (real ?? candidates[0])?.address ?? null;
}

const ip = detectLanIp();
if (!ip) {
  console.error('expo-lan-ip: could not detect a LAN IPv4 address. Is networking up?');
  process.exit(1);
}

console.log(`expo-lan-ip: using ${ip} as REACT_NATIVE_PACKAGER_HOSTNAME`);

// Warn (don't silently rewrite) if the tracked .env's gateway IP has drifted from the
// machine's real current IP - the two are separate concerns (Metro bundle-serving vs the
// app's own API calls) but both need to match reality for device testing to work at all.
try {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = join(here, '..', 'apps', 'frontend', 'conductor-mobile', '.env');
  const env = readFileSync(envPath, 'utf8');
  const match = env.match(/EXPO_PUBLIC_API_GATEWAY_URL=http:\/\/([\d.]+):/);
  if (match && match[1] !== ip) {
    console.warn(
      `expo-lan-ip: WARNING - apps/frontend/conductor-mobile/.env points the API gateway at ` +
        `${match[1]}, but this machine's current LAN IP is ${ip}. A real device on Wi-Fi won't ` +
        `be able to reach the backend until .env is updated to match.`
    );
  }
} catch {
  // .env missing or unreadable - not this script's job to fail over that.
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: ip },
});

process.exit(result.status ?? 1);
