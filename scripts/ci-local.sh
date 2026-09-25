#!/usr/bin/env bash
# Run the Backend CI gates (.github/workflows/backend-ci.yml) locally, so failures are fixed here
# instead of by waiting on GitHub's runners.
#
#   bash scripts/ci-local.sh                       # everything: flyway gate + tests, all services
#   bash scripts/ci-local.sh test core-service     # one gate, one service
#   bash scripts/ci-local.sh flyway                # migration gate only, all services
#
# Keep the commands below in step with backend-ci.yml — that file is the source of truth.
# Not reproducible locally: GitHub's shared-IP effects (e.g. quay.io throttling) and runner env.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVICES=(user-service ticketing-service core-service telemetry-service)
MINIO_IMAGE=bitnamilegacy/minio:2025.7.23-debian-12-r3
PG_PORT=55432
PG_NAME=busmate-ci-local-pg

gate=all
[[ ${1:-} == flyway || ${1:-} == test || ${1:-} == all ]] && { gate=$1; shift; }
services=("$@"); [[ ${#services[@]} -eq 0 ]] && services=("${SERVICES[@]}")
for s in "${services[@]}"; do
  [[ " ${SERVICES[*]} " == *" $s "* ]] || { echo "unknown service: $s (known: ${SERVICES[*]})" >&2; exit 2; }
done

# Flyway locations per service (mirrors the workflow matrix). Tier 2 (reference) only where shipped.
locations() {
  local base=/repo/apps/backend/$1/src/main/resources/db
  case $1 in
    user-service|telemetry-service) echo "filesystem:$base/migration,filesystem:$base/reference" ;;
    *) echo "filesystem:$base/migration" ;;
  esac
}

failed=()

run_flyway() {
  docker rm -f "$PG_NAME" >/dev/null 2>&1 || true
  docker run -d --rm --name "$PG_NAME" -p "$PG_PORT:5432" \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=busmate \
    postgres:16-alpine >/dev/null
  trap 'docker rm -f "$PG_NAME" >/dev/null 2>&1 || true' EXIT
  until docker exec "$PG_NAME" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
  for s in "${services[@]}"; do
    echo "=== flyway: $s ==="
    # Each service gets a brand-new database, like the workflow's per-job service container.
    docker exec "$PG_NAME" psql -U postgres -c "DROP DATABASE IF EXISTS busmate WITH (FORCE)" >/dev/null
    docker exec "$PG_NAME" psql -U postgres -c "CREATE DATABASE busmate" >/dev/null
    docker run --rm --network host -v "$PWD:/repo" redgate/flyway:11 \
      -url="jdbc:postgresql://localhost:$PG_PORT/busmate" -user=postgres -password=postgres \
      -locations="$(locations "$s")" -baselineOnMigrate=true -baselineVersion=1 \
      migrate validate || failed+=("flyway:$s")
  done
}

run_tests() {
  for s in "${services[@]}"; do
    echo "=== test: $s ==="
    if [[ $s == core-service || $s == user-service ]] && ! docker image inspect "$MINIO_IMAGE" >/dev/null 2>&1; then
      docker pull "$MINIO_IMAGE" || echo "warning: MinIO pull failed; BusProfileIntegrationTest will likely fail"
    fi
    (cd "apps/backend/$s" && mvn -B clean verify) || failed+=("test:$s")
  done
}

[[ $gate == all || $gate == flyway ]] && run_flyway
[[ $gate == all || $gate == test ]] && run_tests

echo
if [[ ${#failed[@]} -eq 0 ]]; then echo "ci-local: ALL PASSED"; else echo "ci-local: FAILED -> ${failed[*]}"; exit 1; fi
