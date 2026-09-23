---
id: INC-037
title: A nightly backup leaves the host, and a restore has actually been performed
state: active
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

The destination decision is made: **Backblaze B2**, one bucket (`busmate-prod-backups`), one
application key scoped to that bucket alone with `deleteFiles` withheld — a compromised host can
fill the bucket but cannot erase what's already there. Credentials live only in the VPS's
`config/secrets/.env`, never committed.

- **Host cron, not a stack container.** The backup job is a plain script + systemd timer on the
  VPS, invoking `docker exec` against the running `postgres` container for `pg_dump` and reaching
  MinIO over the existing Docker network for the media mirror. `docker-compose.production.yml`
  stays untouched — the only compose file this increment touches is the observability one, for
  the alerting signal below.
- **`rclone`, not `mc` + a separate encryption step.** One tool for both halves: a `b2` remote for
  the destination, wrapped in a `crypt` remote for transparent encryption on upload — no
  unencrypted bytes leave the host, and there's no separate encrypt-then-upload script to keep in
  sync. `rclone`'s `s3` backend also reaches MinIO directly, so the same tool does both the
  Postgres-dump upload and the media mirror. It's a new binary on the *host*, not a new
  application dependency — available via `apt` on the VPS's own Ubuntu 24.04.
- **`pg_dump -Fc`** (custom format) per database, written to a local staging directory, uploaded,
  then deleted — nothing unencrypted persists on disk between runs.
- **The alerting signal is a Prometheus textfile**, not new machinery: the backup script writes
  `backup_last_success_timestamp_seconds` and `backup_last_success_bytes` to a file node-exporter
  already knows how to read via its textfile collector — one small addition to
  `docker-compose.observability.production.yml` (a mount + a flag on `node-exporter`, already
  running from INC-035), and one new alert rule (`busmate-backup-stale`, alongside INC-036's
  others) rather than inventing a second alerting path.
- **The restore is actually performed**, into scratch containers on the VPS that never touch the
  real `postgres`/`minio` containers, with row counts (`SELECT count(*)` on a few real tables per
  database) and object counts compared against production — run once as part of building this,
  not left as a script nobody has executed.
- Retention: B2's own lifecycle rules, not the backup script — the bucket keeps a bounded number
  of days of history and B2 deletes the rest itself, so retention doesn't depend on a script
  remembering to prune.

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

- ~~Where backups live.~~ Decided: Backblaze B2, `busmate-prod-backups`, a write-only-scoped key.
- ~~Container vs. host cron.~~ Decided: host cron. `docker-compose.production.yml` is untouched.

## Decisions

- See ADR-020, ADR-009
