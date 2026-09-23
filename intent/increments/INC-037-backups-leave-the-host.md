---
id: INC-037
title: A nightly backup leaves the host, and a restore has actually been performed
state: proposed
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Every BusMate database and every stored media object is copied off the host nightly, and a restore of
both into a scratch environment has been performed with its result compared against the source.

## Why now

[ADR-020](../decisions/ADR-020-self-hosted-postgres-on-one-vps.md) took on the work a managed provider
used to do and named this increment as the consequence: an off-host nightly dump with a *tested*
restore is the only thing standing between a lost host and a lost platform. Nothing has been built.

The provider's daily VM snapshot is paid for and running, which is not the same thing and should not
be mistaken for it: it lives in the account that would be lost, it restores a whole machine rather
than a table, and it has never been tested.
[ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md) supplies the second half —
once bytes live outside Postgres, a restore that recovers rows but not objects yields profiles
pointing at nothing.

## Design

A sketch only; this increment is proposed, not shaped, and the destination decision below is what
blocks it.

- `pg_dump` per database from the Postgres image already in the stack, and `mc mirror` for the media
  bucket from the MinIO image, so that protecting production adds no new dependency to it.
- Encrypted before it leaves the host, because the destination is a third party.
- A restore into a scratch database and bucket, with row counts and object counts compared against the
  source — performed as part of this increment rather than promised by it.
- Retention a 154 GB host can afford, and a backup age and size signal that INC-036's alerting can
  watch, so a backup that silently stops is noticed by something other than a restore attempt.

## Acceptance criteria

- [ ] A nightly encrypted backup of all three databases and the media bucket exists off-host.
- [ ] A restore has been performed into a scratch target, and row and object counts match the source.
- [ ] Backup age and size are alertable, so a stopped backup surfaces within a day.
- [ ] The restore procedure is written where someone who did not build it can follow it under pressure.

## Out of scope

- Point-in-time recovery, and any standby host.
- Restore drills on a recurring schedule — worth wanting, after one has been done by hand.
- Backing up Prometheus, Loki or Grafana data, all of which are reconstructible and none of which is
  worth disk on the far end.

## Constraints

- `always_human`: choosing a destination adds a third-party dependency, and a restore rehearsal
  touches production data. Both are on that list, so this increment cannot be shaped without a human
  decision.
- R3: `config/secrets/**`, and `docker-compose.production.yml` if the job runs inside the stack.
- Backup credentials are write-only wherever the destination supports it. A host that can delete its
  own backups has one failure mode that takes both.

## Open questions

- Where backups live. This is a provider decision with a monthly cost attached, and it is what holds
  this increment at proposed. The provider's own object storage keeps the blast radius inside one
  account, which is most of what is wrong with the snapshot that already exists; a second provider
  costs more and removes that.
- Whether the job runs as a container in the production stack or as a host cron, which decides whether
  this touches `docker-compose.production.yml` at all, and therefore how much review it needs.

## Decisions

- See ADR-020, ADR-009
