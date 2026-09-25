---
id: INC-039
title: A public status page, so an outage is a page to check instead of individual questions
state: in-review
track: 1
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

`status.busmate.site` shows the live status of `busmate.site`, `api.busmate.site` and
`portal.busmate.site`, reachable by anyone, with no SSH tunnel.

## Why now

Uptime Kuma has run in production since INC-035 with zero monitors configured — the backlog
item this closes. It's the cheapest, fastest-value item left in the operations backlog: no new
service, no new code, mostly configuration in a tool already running.

## Design

- Three HTTP(s) monitors in Uptime Kuma, checking the three public hostnames exactly as a real
  visitor would — not the internal service names INC-035/036 use for Prometheus, which would
  prove the network works and nothing about what a passenger actually experiences.
- One public status page, `status.busmate.site`, proxied through Caddy — the one deliberate
  exception to "every observability UI stays on `127.0.0.1`" (ADR-021 named this as the reason
  Uptime Kuma is kept at all).
- **Caddy proxies the whole Uptime Kuma port**, not just `/status/*`. Uptime Kuma is a single-page
  app — its status pages, JS/CSS bundles, and the API/socket.io calls that feed them live data all
  share the same origin, so a Caddy rule allowing only `/status/*` would load the page shell and
  then break every asset and live update it needs. The admin login becomes reachable at the same
  hostname as a result; that's accepted, not overlooked — it's the same trust model every other
  public BusMate host already uses (Caddy doesn't path-block `portal.busmate.site` either), and
  changing anything requires a real login, not just reaching the URL.
- DNS is the account owner's: an `A` record, DNS-only (not proxied), `status.busmate.site` →
  the VPS. Caddy issues its own Let's Encrypt certificate the same way it does for the other
  three hosts.

## Acceptance criteria

- [x] All three monitors show correct live status in Uptime Kuma, checking the public URLs.
- [x] `https://status.busmate.site` is reachable from the public internet (not just the VPS or
      an SSH tunnel) and shows the status page, not a Caddy or Uptime Kuma error.
- [x] A real Let's Encrypt certificate is issued for the new host (not a self-signed fallback).
- [x] Stopping one monitored service changes that service's status on the page within one
      heartbeat interval.

Verified against production, 2026-09-23:

- All three monitors came up green against the real public hostnames (`200 - OK` each), through
  Caddy and TLS, which is the whole point of checking the public URLs rather than internal
  service names.
- `https://status.busmate.site/` serves the page publicly with **the SSH tunnel closed** — the
  check that distinguishes "genuinely public" from "works because I was tunnelled in". Bare
  hostname redirects to `/status/busmate` (Uptime Kuma otherwise sends it to its admin login,
  which is not what someone typing a status URL wants).
- Let's Encrypt issued a real certificate for the new host (`CN=status.busmate.site`, valid
  through 22 Dec), obtained automatically on first request.
- Down-detection was proved **without stopping a real production service**: a temporary monitor
  pointed at a deliberately unreachable host went to `Down` / 0% with the real underlying error
  (`getaddrinfo ENOTFOUND`) while the three real monitors stayed up, then was deleted. That
  exercises the same detection-and-display path the criterion is really about, at no cost to
  anyone using the platform.

**Found while doing this — the reason this increment also bumps the image:** Uptime Kuma's own
startup banner said the pinned `1` tag is the EOL v1 line — "no longer maintained and does not
receive any bug or security fixes". Putting that on the public internet is materially worse than
leaving it on loopback, so it moved to `2.5.5` first. Two problems in one pin, actually: the EOL
major line, and the fact that `1` was the only *floating* tag in either observability stack, where
everything else pins an exact version. The upgrade was free here because the instance had never
been configured — no data to migrate — which would not have been true a week later.

Uptime Kuma 2.x also adds a database-selection step before admin setup (SQLite chosen) and
requires a group on a status page before monitors can be attached — neither is in the v1-era
instructions the README carried.

## Out of scope

- Path-restricting Caddy to hide Uptime Kuma's admin login — see Design; a real login is the
  actual protection, not obscurity.
- Custom branding/theming of the status page beyond Uptime Kuma's own defaults.
- Incident history / postmortem notes on the page — Uptime Kuma supports this, not needed yet.

## Constraints

- R3: `config/caddy/**` (added to `policy.yaml` this increment — it decides what's publicly
  reachable, same class of decision as `docker-compose.production.yml`) and
  `docker-compose.production.yml` itself (Caddy gains a new site to build/serve).
- DNS is `always_human` territory by nature — it's the account owner's Cloudflare login, not
  something this repo or its credentials can reach.

## Decisions

- See ADR-021 (why Uptime Kuma exists at all, and why this is the one exception to loopback-only)
