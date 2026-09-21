---
id: INC-033
title: The gateway behaves correctly behind a reverse proxy, and no Supabase credential ships in the code
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Behind Caddy, the gateway limits each real client separately instead of treating every visitor as one
address. And a fresh checkout of the repository contains no live third-party credential.

## Why now

Both are launch blockers found in the INC-032 audit. Without the first, the first busy hour throttles
every passenger at once, because they all arrive from Caddy's address. The second matters more now
that the repository is public.

## Design

- **`TRUST_PROXY_HOPS`** tells the gateway how many proxies sit in front of it. It defaults to 0, so a
  developer hitting the gateway directly is unaffected and `X-Forwarded-For` stays ignored — trusting
  it with no proxy would let a client choose its own address and dodge the limit. Production sets 1.
- **`AUTH_RATE_LIMIT_MAX`** replaces the hardcoded 10 attempts a minute on login, register and
  forgot-password. Mobile carriers in Sri Lanka put many subscribers behind one address, so production
  allows 300 general requests and 20 auth attempts a minute per address, up from 100 and 10.
- **Ticketing's `supabase:` config block is deleted.** Nothing in the service reads it; it only
  carried a real anon key and a project URL as defaults.

## Acceptance criteria

- [x] Two clients behind the same proxy are rate-limited independently when the proxy hop is trusted.
- [x] With no proxy trusted, a client cannot escape the limit by rotating `X-Forwarded-For`.
- [x] `application.yml` for ticketing-service contains no Supabase key or project URL.

## Out of scope

- Generating the production signing keys and secrets. That is server-side configuration, not code, and
  happens when the production `.env` is written.
- Removing the gateway's legacy HS256 verification path and `SupabaseAuthClient`. Deleting an auth path
  is its own reviewed change.
- Rotating or deleting the Supabase projects whose keys are already in git history. Removing them from
  the tree does not un-publish them; only deleting the projects does, and that is the owner's action.

## Constraints

- R3: touches the gateway's middleware and `docker-compose.production.yml`. Named reviewer required.
- Nothing here relaxes a security control. `TRUST_PROXY_HOPS` tightens per-client accuracy; the raised
  auth limit trades some brute-force headroom for not locking out shared-address users, and is
  configurable back down.

## Open questions

- 20 auth attempts a minute per address is a guess at what a shared carrier address needs. Revisit if
  the gateway logs show either lockouts of genuine users or credential-stuffing bursts.

## Decisions

- See ADR-020
