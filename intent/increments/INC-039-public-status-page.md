---
id: INC-039
title: A public status page, so an outage is a page to check instead of individual questions
state: shaped
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

- [ ] All three monitors show correct live status in Uptime Kuma, checking the public URLs.
- [ ] `https://status.busmate.site` is reachable from the public internet (not just the VPS or
      an SSH tunnel) and shows the status page, not a Caddy or Uptime Kuma error.
- [ ] A real Let's Encrypt certificate is issued for the new host (not a self-signed fallback).
- [ ] Stopping one monitored service changes that service's status on the page within one
      heartbeat interval.

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
