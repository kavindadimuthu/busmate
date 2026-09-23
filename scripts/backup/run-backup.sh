#!/bin/bash
# Nightly off-host backup (INC-037, ADR-020, ADR-009).
#
# Runs from the VPS host, not inside the app stack — docker-compose.production.yml is
# untouched by this. Two things leave the host, both through one crypt-wrapped rclone
# remote so nothing unencrypted ever crosses the network:
#   1. pg_dump of all three databases, via `docker exec` into the running postgres
#      container (no separate Postgres client needed — same binary, same version, always
#      compatible).
#   2. A mirror of the MinIO media bucket, via a one-off rclone container attached to the
#      app's own Docker network — MinIO's port is never published to the host (only Caddy
#      is), so this is the one place a container is required instead of a host binary.
#
# On success, writes a Prometheus textfile node-exporter already knows how to read
# (INC-036's busmate-backup-stale alert watches it) — and only on success, so a failed
# run leaves the last real success timestamp in place rather than lying about a new one.
#
# Run manually to test: sudo -u deploy /opt/busmate/scripts/backup/run-backup.sh
# Installed as a systemd timer — see scripts/backup/README.md.
set -euo pipefail

REPO_DIR="/opt/busmate"
SECRETS_FILE="$REPO_DIR/config/secrets/.env"
STAGING_DIR="$(mktemp -d /tmp/busmate-backup.XXXXXX)"
METRICS_DIR="/opt/busmate/backup-metrics"
METRICS_FILE="$METRICS_DIR/backup.prom"
LOG_TAG="busmate-backup"
TIMESTAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
DATABASES=(busmate_core busmate_user busmate_ticketing)

log() { logger -t "$LOG_TAG" -- "$*"; echo "$*"; }

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

# config/secrets/.env holds multi-line PEM values (AUTH_JWT_RSA_*), which a plain `source`
# does not survive — read only the specific keys this script needs instead.
getvar() {
  grep -m1 "^$1=" "$SECRETS_FILE" | cut -d= -f2-
}

for required in B2_KEY_ID B2_APP_KEY B2_BUCKET BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED \
                MEDIA_S3_ACCESS_KEY MEDIA_S3_SECRET_KEY MEDIA_S3_BUCKET; do
  if [ -z "$(getvar "$required")" ]; then
    log "FAILED: $required is not set in $SECRETS_FILE"
    exit 1
  fi
done

export RCLONE_CONFIG_B2REMOTE_TYPE=b2
export RCLONE_CONFIG_B2REMOTE_ACCOUNT="$(getvar B2_KEY_ID)"
export RCLONE_CONFIG_B2REMOTE_KEY="$(getvar B2_APP_KEY)"
export RCLONE_CONFIG_CRYPT_TYPE=crypt
export RCLONE_CONFIG_CRYPT_REMOTE="b2remote:$(getvar B2_BUCKET)"
export RCLONE_CONFIG_CRYPT_PASSWORD="$(getvar BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED)"
export RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION=standard

log "starting: staging=$STAGING_DIR timestamp=$TIMESTAMP"

# ── 1. Postgres: dump each database, custom format (pg_restore can pick tables/order) ──
for db in "${DATABASES[@]}"; do
  log "pg_dump $db"
  docker exec busmate-postgres-1 pg_dump -U postgres -Fc "$db" \
    > "$STAGING_DIR/$db.dump"
done

# Fixed path, overwritten nightly — not a new timestamped folder each run. B2's own
# versioning + lifecycle rule (config/observability/README.md has the one-time console
# setup) retains N days of history per file automatically; a lifecycle rule can't act on
# "folders older than N days" the way it can on "versions of this file older than N days".
log "uploading database dumps to B2"
rclone -q copy "$STAGING_DIR" "crypt:db/" \
  --include "*.dump"

# ── 2. MinIO media bucket: mirrored via a one-off container on the app's network, since
#    MinIO's port isn't published to the host (only Caddy's is). ──
log "mirroring MinIO media bucket to B2"
docker run --rm --network busmate_default \
  -e RCLONE_CONFIG_B2REMOTE_TYPE="$RCLONE_CONFIG_B2REMOTE_TYPE" \
  -e RCLONE_CONFIG_B2REMOTE_ACCOUNT="$RCLONE_CONFIG_B2REMOTE_ACCOUNT" \
  -e RCLONE_CONFIG_B2REMOTE_KEY="$RCLONE_CONFIG_B2REMOTE_KEY" \
  -e RCLONE_CONFIG_CRYPT_TYPE="$RCLONE_CONFIG_CRYPT_TYPE" \
  -e RCLONE_CONFIG_CRYPT_REMOTE="$RCLONE_CONFIG_CRYPT_REMOTE" \
  -e RCLONE_CONFIG_CRYPT_PASSWORD="$RCLONE_CONFIG_CRYPT_PASSWORD" \
  -e RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION="$RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION" \
  -e RCLONE_CONFIG_MINIOSRC_TYPE=s3 \
  -e RCLONE_CONFIG_MINIOSRC_PROVIDER=Minio \
  -e RCLONE_CONFIG_MINIOSRC_ENDPOINT=http://minio:9000 \
  -e RCLONE_CONFIG_MINIOSRC_ACCESS_KEY_ID="$(getvar MEDIA_S3_ACCESS_KEY)" \
  -e RCLONE_CONFIG_MINIOSRC_SECRET_ACCESS_KEY="$(getvar MEDIA_S3_SECRET_KEY)" \
  -e RCLONE_CONFIG_MINIOSRC_REGION="$(getvar MEDIA_S3_REGION)" \
  rclone/rclone:1.68 \
  sync "miniosrc:$(getvar MEDIA_S3_BUCKET)" "crypt:media/" -q

# ── 3. Alertable signal (INC-036's busmate-backup-stale watches this) ──
BACKUP_BYTES=$(du -sb "$STAGING_DIR" | cut -f1)
mkdir -p "$METRICS_DIR"
cat > "$METRICS_FILE.tmp" <<EOF
# HELP backup_last_success_timestamp_seconds Unix time of the last backup that fully succeeded.
# TYPE backup_last_success_timestamp_seconds gauge
backup_last_success_timestamp_seconds $(date +%s)
# HELP backup_last_success_bytes Size in bytes of the last successful database dump set.
# TYPE backup_last_success_bytes gauge
backup_last_success_bytes $BACKUP_BYTES
EOF
mv "$METRICS_FILE.tmp" "$METRICS_FILE"

log "done: $TIMESTAMP, ${BACKUP_BYTES} bytes of database dumps"
