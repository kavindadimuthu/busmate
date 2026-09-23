#!/bin/bash
# Restore drill (INC-037): proves the backup is actually restorable, not just present.
#
# Downloads the latest backup from B2, restores each database into a throwaway scratch
# Postgres — never the real one — and compares row counts on each database's largest
# tables against the live production database (read-only queries only). Does the same
# for the media bucket by comparing object counts, without needing a scratch MinIO.
#
# Run by hand on the VPS: sudo -u deploy /opt/busmate/scripts/backup/restore-drill.sh
# Not scheduled — see INC-037's "Out of scope": a recurring drill is a later increment,
# once this one has been run by hand at least once.
set -euo pipefail

REPO_DIR="/opt/busmate"
SECRETS_FILE="$REPO_DIR/config/secrets/.env"
SCRATCH_DIR="$(mktemp -d /tmp/busmate-restore-drill.XXXXXX)"
SCRATCH_NETWORK="busmate-restore-drill"
SCRATCH_PG_CONTAINER="busmate-restore-drill-pg"
SCRATCH_PG_PASSWORD="drill-only-$(openssl rand -hex 8)"
DATABASES=(busmate_core busmate_user busmate_ticketing)
PASS=true

log() { echo "[restore-drill] $*"; }
fail() { echo "[restore-drill] FAIL: $*"; PASS=false; }

cleanup() {
  log "cleaning up scratch resources"
  docker rm -f "$SCRATCH_PG_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$SCRATCH_NETWORK" >/dev/null 2>&1 || true
  rm -rf "$SCRATCH_DIR"
}
trap cleanup EXIT

getvar() { grep -m1 "^$1=" "$SECRETS_FILE" | cut -d= -f2-; }

export RCLONE_CONFIG_B2REMOTE_TYPE=b2
export RCLONE_CONFIG_B2REMOTE_ACCOUNT="$(getvar B2_KEY_ID)"
export RCLONE_CONFIG_B2REMOTE_KEY="$(getvar B2_APP_KEY)"
export RCLONE_CONFIG_CRYPT_TYPE=crypt
export RCLONE_CONFIG_CRYPT_REMOTE="b2remote:$(getvar B2_BUCKET)"
export RCLONE_CONFIG_CRYPT_PASSWORD="$(getvar BACKUP_RCLONE_CRYPT_PASSWORD_OBSCURED)"
export RCLONE_CONFIG_CRYPT_FILENAME_ENCRYPTION=standard

# ── 1. Pull the latest dumps down and check they're non-empty ──────────────────────────
log "downloading latest database dumps from B2"
rclone -q copy "crypt:db/" "$SCRATCH_DIR" --include "*.dump"
for db in "${DATABASES[@]}"; do
  size=$(stat -c%s "$SCRATCH_DIR/$db.dump" 2>/dev/null || echo 0)
  if [ "$size" -lt 1000 ]; then
    fail "$db.dump is missing or suspiciously small ($size bytes)"
  else
    log "$db.dump: $size bytes"
  fi
done

# ── 2. Restore into a scratch Postgres, isolated on its own network ────────────────────
log "starting scratch Postgres"
docker network create "$SCRATCH_NETWORK" >/dev/null
docker run -d --name "$SCRATCH_PG_CONTAINER" --network "$SCRATCH_NETWORK" \
  -e POSTGRES_PASSWORD="$SCRATCH_PG_PASSWORD" \
  postgres:16-alpine >/dev/null
for _ in $(seq 1 30); do
  docker exec "$SCRATCH_PG_CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 2
done

for db in "${DATABASES[@]}"; do
  log "restoring $db into scratch Postgres"
  docker exec "$SCRATCH_PG_CONTAINER" createdb -U postgres "$db"
  docker cp "$SCRATCH_DIR/$db.dump" "$SCRATCH_PG_CONTAINER:/tmp/$db.dump"
  docker exec "$SCRATCH_PG_CONTAINER" pg_restore -U postgres -d "$db" "/tmp/$db.dump" \
    2>&1 | grep -v "^pg_restore: warning" || true
done

# ── 3. Compare row counts on each database's three largest tables against the live one ──
for db in "${DATABASES[@]}"; do
  log "comparing row counts for $db"
  tables=$(docker exec "$SCRATCH_PG_CONTAINER" psql -U postgres -d "$db" -tAc "
    SELECT relname FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC LIMIT 3;")
  if [ -z "$tables" ]; then
    fail "$db: could not determine any tables to compare — restore may have failed silently"
    continue
  fi
  while IFS= read -r table; do
    [ -z "$table" ] && continue
    scratch_count=$(docker exec "$SCRATCH_PG_CONTAINER" psql -U postgres -d "$db" -tAc \
      "SELECT count(*) FROM \"$table\";")
    live_count=$(docker exec busmate-postgres-1 psql -U postgres -d "$db" -tAc \
      "SELECT count(*) FROM \"$table\";")
    if [ "$scratch_count" = "$live_count" ]; then
      log "  $db.$table: $scratch_count rows (matches live)"
    else
      fail "$db.$table: restored=$scratch_count live=$live_count — MISMATCH"
    fi
  done <<< "$tables"
done

# ── 4. Media: compare object counts between the encrypted mirror and the live bucket ───
log "comparing media object counts"
backup_count=$(rclone -q lsf "crypt:media/" --recursive --files-only | wc -l)
live_count=$(docker run --rm --network busmate_default \
  -e RCLONE_CONFIG_MINIOSRC_TYPE=s3 \
  -e RCLONE_CONFIG_MINIOSRC_PROVIDER=Minio \
  -e RCLONE_CONFIG_MINIOSRC_ENDPOINT=http://minio:9000 \
  -e RCLONE_CONFIG_MINIOSRC_ACCESS_KEY_ID="$(getvar MEDIA_S3_ACCESS_KEY)" \
  -e RCLONE_CONFIG_MINIOSRC_SECRET_ACCESS_KEY="$(getvar MEDIA_S3_SECRET_KEY)" \
  -e RCLONE_CONFIG_MINIOSRC_REGION="$(getvar MEDIA_S3_REGION)" \
  rclone/rclone:1.68 \
  lsf "miniosrc:$(getvar MEDIA_S3_BUCKET)" --recursive --files-only -q | wc -l)
if [ "$backup_count" = "$live_count" ]; then
  log "  media objects: $backup_count (matches live)"
else
  fail "media object count: backup=$backup_count live=$live_count — MISMATCH"
fi

echo
if $PASS; then
  log "RESULT: PASS — restore is genuinely restorable, and matches production"
  exit 0
else
  log "RESULT: FAIL — see above. Do not treat the backup as trustworthy until this is understood."
  exit 1
fi
