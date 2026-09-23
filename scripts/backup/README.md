# BusMate backups (INC-037, ADR-020, ADR-009)

What exists, where it lives, and — the part that matters if you're reading this at 3am — how to
actually get data back.

## What's backed up, and what isn't

| Backed up | Not backed up |
|---|---|
| All three Postgres databases (`busmate_core`, `busmate_user`, `busmate_ticketing`) | Prometheus, Loki, Grafana data — all reconstructible, none worth disk on the far end |
| The MinIO media bucket (profile photos, etc.) | Redpanda — nothing durable is expected to live only in Kafka |
| | Point-in-time recovery — this is a nightly snapshot, not continuous replication |

## Where it lives

**Backblaze B2**, bucket `busmate-prod-backups`, encrypted with `rclone crypt` before it ever
leaves the VPS — B2 itself never sees an unencrypted byte, and the raw bucket shows only
gibberish filenames and paths. The application key used to write it (`B2_KEY_ID`/`B2_APP_KEY` in
`config/secrets/.env`) is scoped to that one bucket and **cannot delete anything** — a compromised
host can fill the bucket, not empty it.

Two fixed paths, overwritten nightly rather than one new folder per run — this is what lets B2's
own version history (below) provide retention, instead of a pruning script that has to be trusted
to run correctly forever:

- `db/busmate_core.dump`, `db/busmate_user.dump`, `db/busmate_ticketing.dump` — `pg_dump -Fc`
  output, each restorable independently with `pg_restore`.
- `media/...` — a mirror of the MinIO bucket, same relative paths.

## How it runs

A systemd timer on the VPS (`busmate-backup.timer` → `busmate-backup.service`), **not** a
container in `docker-compose.production.yml` — the backup job touches nothing in the app stack's
own compose file. Nightly at 20:30 UTC (02:00 Sri Lanka time, the platform's real low-traffic
window), plus up to 10 minutes of random jitter.

```bash
# Check it's actually scheduled
systemctl list-timers busmate-backup.timer

# Run it by hand (safe — idempotent, just overwrites the same B2 paths)
sudo /opt/busmate/scripts/backup/run-backup.sh

# See what the last run(s) actually did
journalctl -u busmate-backup.service -n 100
```

It only writes its "last success" metrics file
(`backup-metrics/backup.prom` → node-exporter's textfile collector → Prometheus →
`busmate-backup-stale`, INC-036) after every step has actually succeeded — a partial failure
leaves the previous real success timestamp in place, so the alert fires on a stopped or broken
backup rather than staying quiet because *something* ran.

## Restoring for real — read this before you start

This is written for someone who did not build this, under time pressure. Go in order.

**0. Don't panic about the encrypted filenames.** Everything below goes through the `crypt:`
rclone remote, which handles decryption transparently — you will only ever see real filenames and
readable database dumps. You never touch the raw B2 bucket directly.

**1. Get onto the VPS**, or a fresh machine with Docker and `rclone` if the VPS itself is what's
gone:
```bash
ssh -p 22022 deploy@104.207.77.183   # or wherever the replacement host is
```

**2. Set up rclone's remotes** (these are just environment variables — nothing persists to disk).
Get the four `B2_*` values and `BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED` from
`config/secrets/.env` (or, if that's gone too, from wherever secrets are recovered from — they
are **not** stored anywhere else, by design):
```bash
export RCLONE_CONFIG_B2REMOTE_TYPE=b2
export RCLONE_CONFIG_B2REMOTE_ACCOUNT="<B2_KEY_ID>"
export RCLONE_CONFIG_B2REMOTE_KEY="<B2_APP_KEY>"
export RCLONE_CONFIG_CRYPT_TYPE=crypt
export RCLONE_CONFIG_CRYPT_REMOTE="b2remote:<B2_BUCKET>"
export RCLONE_CONFIG_CRYPT_PASSWORD="<BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED>"
export RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION=standard
```

**3. Confirm you can actually see the backup before doing anything destructive:**
```bash
rclone lsf crypt:db/
# should list: busmate_core.dump  busmate_user.dump  busmate_ticketing.dump
```

**4. Restoring a database.** This example is `busmate_core` — repeat per database. **Restoring
into the live `postgres` container overwrites what's there now — make sure that's actually what
you want**, or restore into a fresh scratch container first (see `restore-drill.sh` for exactly
that pattern) if you just need to recover data without wiping the current state.

```bash
rclone copy crypt:db/ /tmp/restore/ --include "busmate_core.dump"
docker cp /tmp/restore/busmate_core.dump busmate-postgres-1:/tmp/
# DESTRUCTIVE from here — this replaces the live database's contents:
docker exec busmate-postgres-1 dropdb -U postgres busmate_core
docker exec busmate-postgres-1 createdb -U postgres busmate_core
docker exec busmate-postgres-1 pg_restore -U postgres -d busmate_core /tmp/busmate_core.dump
```

**5. Restoring media.** Same idea, mirrored back into MinIO instead of dropped/recreated (media
doesn't need a drop — it's just files):
```bash
docker run --rm --network busmate_default \
  -e RCLONE_CONFIG_B2REMOTE_TYPE=b2 -e RCLONE_CONFIG_B2REMOTE_ACCOUNT="<B2_KEY_ID>" \
  -e RCLONE_CONFIG_B2REMOTE_KEY="<B2_APP_KEY>" -e RCLONE_CONFIG_CRYPT_TYPE=crypt \
  -e RCLONE_CONFIG_CRYPT_REMOTE="b2remote:<B2_BUCKET>" \
  -e RCLONE_CONFIG_CRYPT_PASSWORD="<BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED>" \
  -e RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION=standard \
  -e RCLONE_CONFIG_MINIODST_TYPE=s3 -e RCLONE_CONFIG_MINIODST_PROVIDER=Minio \
  -e RCLONE_CONFIG_MINIODST_ENDPOINT=http://minio:9000 \
  -e RCLONE_CONFIG_MINIODST_ACCESS_KEY_ID="<MEDIA_S3_ACCESS_KEY>" \
  -e RCLONE_CONFIG_MINIODST_SECRET_ACCESS_KEY="<MEDIA_S3_SECRET_KEY>" \
  -e RCLONE_CONFIG_MINIODST_REGION="<MEDIA_S3_REGION>" \
  rclone/rclone:1.68 sync crypt:media/ "miniodst:<MEDIA_S3_BUCKET>"
```

**6. Recovering an *older* version, not last night's.** B2 keeps file version history — this is
what "retention" means here (see below). In the B2 web console: Browse Files → the bucket → the
file → **Version History**, pick the version by date, download it directly (it will be encrypted —
decrypt with `rclone` pointed at a local file instead of the remote, or restore it to a temporary
path in the bucket first and `rclone copy` it from there through the `crypt:` remote as above).

## If you just need to prove the backup actually works, not recover anything

```bash
sudo /opt/busmate/scripts/backup/restore-drill.sh
```

Restores every database into a throwaway scratch Postgres (never the real one), compares row
counts on each database's three largest tables against live production, and compares media object
counts the same way. Prints PASS or FAIL. Cleans up everything it created either way. Not
scheduled — run it by hand after anything that could plausibly have broken the backup path (a
Postgres version bump, a `docker-compose.production.yml` change, rotating the B2 key).

## Retention

B2's own file versioning, not a pruning step in `run-backup.sh` — a script that has to remember to
delete old backups is one more thing that can silently stop working. **This needs a one-time
setup in the B2 web console** (the app's own scoped key can't set bucket-level lifecycle rules,
deliberately — see below):

1. B2 console → the bucket → **Lifecycle Settings**.
2. Choose **Keep only the last version** → **No** (you want history, not just the latest).
3. Choose the custom option: **"Keep previous file versions for `N` days, then delete them"** — a
   value that fits the account's storage budget. 30 days is a reasonable starting point for a
   platform at this size; revisit once real usage shows how fast the databases grow.

This uses the account's own login, not `B2_KEY_ID`/`B2_APP_KEY` — the app's key is deliberately
scoped to read/write/list only, with no bucket-administration capability, so a leaked application
key can't be used to shorten retention and quietly destroy history.

## Why these specific choices

- **`rclone`, one tool for both halves.** A `b2` remote wrapped in a `crypt` remote handles
  encryption transparently on upload/download; the same tool's `s3` backend reaches MinIO
  directly (it isn't natively an S3 target, but treating it as one works). One tool, one place
  encryption can be gotten wrong, not two.
- **Host cron, not a stack container.** `docker-compose.production.yml` never changes for this;
  the job runs via `docker exec`/`docker run` from the host, invisible to anything that reads that
  compose file's diff history.
- **Fixed paths, not timestamped folders.** B2's lifecycle rules act on a file's own version
  history, not on "how old is this folder" — matching that shape is what lets retention be a
  B2 setting instead of custom code.
