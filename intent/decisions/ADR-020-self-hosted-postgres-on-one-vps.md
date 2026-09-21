# ADR-020: Production runs on one self-hosted VPS, with our own Postgres

- **Status:** accepted
- **Date:** 2026-09-21
- **Supersedes:** nothing. It settles an assumption the `prod` Spring profiles carried but never stated.

## Context

The three Spring services' `application-prod.yml` files each say "Production: Supabase-hosted
Postgres". That was never a decision anyone took; it was where the development databases happened to
live. Standing up a real production environment forced the question.

BusMate is going live as a public-transport data platform for Sri Lanka with no revenue, a small
team, and an explicit constraint that running costs must stay near the price of one small server.

Two further facts shaped this. The owner's stated intent is to run the system independently of any
managed provider. And the repository is public, with Supabase `anon` and `service_role` keys for two
projects committed in its history — a managed provider whose credentials are in that history is not
a provider we can keep using without rotating everything anyway.

## Decision

Production is **one VPS** running the whole stack under Docker Compose, including **our own
Postgres** in a container with a named volume. No managed database, no managed queue, no managed
object store. Media goes to MinIO on the same host, behind the existing `MEDIA_S3_*` seam.

Nothing in the stack may use a provider-specific API. The substitutable pieces — Postgres, the S3
endpoint, the Kafka bootstrap address — stay addressable by URL so that any one of them can move to a
managed service later without touching application code.

## Consequences

We take on what the provider used to do: backups, restores, upgrades and disk headroom are now ours.
Backups therefore stop being optional — an off-host nightly dump with a *tested* restore is the only
thing standing between a lost droplet and a lost platform, and it gets its own increment rather than
being folded into deployment.

One host means one failure domain. A single VPS has no redundancy, and we accept visible downtime
during a restore. That is the correct trade at zero revenue and it is reversible: because everything
is addressed by URL, moving Postgres to a managed service is a credential change and a data copy, not
a rewrite.

Cost lands at roughly $26/month plus backups, against roughly $50 for the same specs on DigitalOcean
or Hetzner Singapore and a further $25+ for managed Postgres.

The `prod` profiles' comments naming Supabase become wrong the moment this lands, and are corrected
with it. Both Supabase projects are to be deleted once confirmed unneeded; their keys are compromised.
