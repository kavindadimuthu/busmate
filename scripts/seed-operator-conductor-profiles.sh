#!/usr/bin/env bash
# seed-operator-conductor-profiles.sh — BusMate operator/conductor seed data
#
# Wipes every existing operator/conductor account and every core-service
# Operator/Bus/PassengerServicePermit row (all of it predates the unified operator
# lifecycle work and is unlinked test data), then creates a small, fixed set of
# Sri-Lankan-context operator and conductor profiles that go through the *real*
# unified lifecycle: a real Supabase Auth account + user-service User/UserProfile
# rows + a linked core-service Operator row created via the same /internal/operators
# contract OperatorSyncService uses in production.
#
# See docs/database-reset-and-seed-guide.md for prerequisites and usage, and
# docs/operator-conductor-seed-credentials.md for the resulting login list.
#
# Usage:
#   ./scripts/seed-operator-conductor-profiles.sh
#
# Requires: psql, curl, jq, and core-service running locally (the operator rows
# are created through its live /internal/operators endpoint, not raw SQL, so the
# seeded data is provably consistent with what that endpoint actually produces).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Config ──────────────────────────────────────────────────────────────────

# user-service's database — loaded from the repo root .env, same as dev:user-service.
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi
: "${SPRING_DATASOURCE_USERNAME:?SPRING_DATASOURCE_USERNAME must be set (see repo root .env)}"
: "${SPRING_DATASOURCE_PASSWORD:?SPRING_DATASOURCE_PASSWORD must be set (see repo root .env)}"
: "${SUPABASE_URL:?SUPABASE_URL must be set (see repo root .env)}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY must be set (see repo root .env)}"

USER_DB_HOST="aws-0-ap-southeast-1.pooler.supabase.com"
USER_DB_PORT="6543"
USER_DB_CONN="postgresql://${SPRING_DATASOURCE_USERNAME}:${SPRING_DATASOURCE_PASSWORD}@${USER_DB_HOST}:${USER_DB_PORT}/postgres?sslmode=require"

# core-service has its OWN database — distinct from the one above (see
# apps/backend/core-service/src/main/resources/application.yml). Its dev script
# (pnpm run dev:core-service) does not load the repo root .env, so these default
# to core-service's own application.yml fallbacks. Override with real
# CORE_SERVICE_DB_* env vars if your core-service is configured differently.
CORE_DB_USER="${CORE_SERVICE_DB_USERNAME:-postgres.bixiyzllxffxqwutthmk}"
CORE_DB_PASSWORD="${CORE_SERVICE_DB_PASSWORD:-root}"
CORE_DB_CONN="postgresql://${CORE_DB_USER}:${CORE_DB_PASSWORD}@${USER_DB_HOST}:${USER_DB_PORT}/postgres?sslmode=require"

CORE_SERVICE_URL="${CORE_SERVICE_URL:-http://localhost:9010}"
# Matches core-service's application.yml fallback (internal.api-key) — core-service's
# dev script doesn't load repo root .env, so it's running with this default unless you
# set INTERNAL_API_KEY in core-service's own environment.
CORE_INTERNAL_API_KEY="${CORE_SERVICE_INTERNAL_API_KEY:-dev-only-internal-api-key-change-me}"

# ── Helpers ─────────────────────────────────────────────────────────────────

log() { echo "==> $*"; }

gen_uuid() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  elif [ -r /proc/sys/kernel/random/uuid ]; then
    cat /proc/sys/kernel/random/uuid
  else
    python3 -c "import uuid; print(uuid.uuid4())"
  fi
}

psql_user() { psql "$USER_DB_CONN" -v ON_ERROR_STOP=1 -q "$@"; }
psql_core() { psql "$CORE_DB_CONN" -v ON_ERROR_STOP=1 -q "$@"; }

# create_auth_user email password full_name user_type -> prints the new Supabase user id
#
# Sets app_metadata.user_type/account_status at creation time — this is what
# AuthService.createUser() does via a follow-up updateUserAppMetadata() call in the real
# admin-create flow; LoginResponse.userType (and any other app_metadata-based read) would
# come back null without it even though the account otherwise works fine.
create_auth_user() {
  local email="$1" password="$2" full_name="$3" user_type="$4"
  local response
  response=$(curl -sf -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg email "$email" --arg password "$password" --arg name "$full_name" --arg type "$user_type" \
      '{email:$email, password:$password, email_confirm:true,
        user_metadata:{full_name:$name},
        app_metadata:{user_type:$type, account_status:"active"}}')")
  echo "$response" | jq -r '.id'
}

delete_auth_user() {
  local uid="$1"
  curl -sf -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${uid}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" >/dev/null || \
    log "  (warning: could not delete Supabase Auth user $uid — continuing)"
}

# create_operator_account email password full_name username phone org_name reg_id operator_type region
# -> prints "<user_id> <core_operator_id>"
create_operator_account() {
  local email="$1" password="$2" full_name="$3" username="$4" phone="$5"
  local org_name="$6" reg_id="$7" operator_type="$8" region="$9"

  local user_id
  user_id=$(create_auth_user "$email" "$password" "$full_name" "operator")

  psql_user -c "
    INSERT INTO users (user_id, email, full_name, username, phone_number, user_type_id,
                        account_status, is_email_verified)
    VALUES ('${user_id}', '${email}', '${full_name}', '${username}', '${phone}',
            (SELECT id FROM user_types WHERE name = 'operator'), 'active', true);
  " >/dev/null

  local profile_json
  profile_json=$(jq -n --arg org "$org_name" --arg reg "$reg_id" --arg type "$operator_type" --arg region "$region" \
    '{organization_name:$org, registration_id:$reg, operator_type:$type, region:$region}')
  psql_user -c "
    INSERT INTO user_profiles (user_id, profile_data)
    VALUES ('${user_id}', '${profile_json}'::jsonb);
  " >/dev/null

  local operator_response core_operator_id
  operator_response=$(curl -sf -X POST "${CORE_SERVICE_URL}/internal/operators" \
    -H "X-Internal-Api-Key: ${CORE_INTERNAL_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg uid "$user_id" --arg name "$org_name" --arg type "$operator_type" --arg region "$region" \
      '{userId:$uid, name:$name, operatorType:$type, region:$region, status:"active"}')")
  core_operator_id=$(echo "$operator_response" | jq -r '.id')

  echo "${user_id} ${core_operator_id}"
}

# create_conductor_account email password full_name username phone employee_id nic assign_operator_id
create_conductor_account() {
  local email="$1" password="$2" full_name="$3" username="$4" phone="$5"
  local employee_id="$6" nic="$7" assign_operator_id="$8"

  local user_id
  user_id=$(create_auth_user "$email" "$password" "$full_name" "conductor")

  psql_user -c "
    INSERT INTO users (user_id, email, full_name, username, phone_number, user_type_id,
                        account_status, is_email_verified)
    VALUES ('${user_id}', '${email}', '${full_name}', '${username}', '${phone}',
            (SELECT id FROM user_types WHERE name = 'conductor'), 'active', true);
  " >/dev/null

  local profile_json
  profile_json=$(jq -n --arg emp "$employee_id" --arg nic "$nic" --arg opId "$assign_operator_id" \
    '{employee_id:$emp, nic_number:$nic, assign_operator_id:$opId}')
  psql_user -c "
    INSERT INTO user_profiles (user_id, profile_data)
    VALUES ('${user_id}', '${profile_json}'::jsonb);
  " >/dev/null

  echo "$user_id"
}

# create_bus operator_id ntc_reg plate capacity model
create_bus() {
  local operator_id="$1" ntc_reg="$2" plate="$3" capacity="$4" model="$5"
  local id; id=$(gen_uuid)
  psql_core -c "
    INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model,
                      facilities, status, created_at, updated_at, created_by, updated_by, version)
    VALUES ('${id}', '${operator_id}', '${ntc_reg}', '${plate}', ${capacity}, '${model}',
            '{\"gps\": true, \"wifi\": false, \"air_conditioning\": true, \"wheelchair_accessible\": false}'::jsonb,
            'active', now(), now(), 'seed-script', 'seed-script', 0);
  " >/dev/null
}

# create_permit operator_id route_group_id permit_number permit_type max_buses
create_permit() {
  local operator_id="$1" route_group_id="$2" permit_number="$3" permit_type="$4" max_buses="$5"
  local id; id=$(gen_uuid)
  psql_core -c "
    INSERT INTO passenger_service_permit (id, operator_id, route_group_id, permit_number,
                        issue_date, maximum_bus_assigned, status, permit_type,
                        created_at, updated_at, created_by, updated_by, version)
    VALUES ('${id}', '${operator_id}', '${route_group_id}', '${permit_number}',
            CURRENT_DATE, ${max_buses}, 'active', '${permit_type}',
            now(), now(), 'seed-script', 'seed-script', 0);
  " >/dev/null
}

# ── Phase 1: wipe stale core-service fleet data ────────────────────────────

log "Wiping stale core-service data (trip, permit assignments, permits, buses, operators)..."
psql_core -c "DELETE FROM trip;"
psql_core -c "DELETE FROM bus_passenger_service_permit_assignment;"
psql_core -c "DELETE FROM passenger_service_permit;"
psql_core -c "DELETE FROM bus;"
psql_core -c "DELETE FROM operator;"

# ── Phase 2: wipe stale operator/conductor accounts ────────────────────────

log "Finding existing operator/conductor accounts to remove..."
STALE_USER_IDS=$(psql_user -t -A -c "
  SELECT u.user_id FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name IN ('operator','conductor');
")

if [ -n "$STALE_USER_IDS" ]; then
  COUNT=$(echo "$STALE_USER_IDS" | wc -l)
  log "Deleting $COUNT stale operator/conductor Supabase Auth accounts..."
  while IFS= read -r uid; do
    [ -n "$uid" ] && delete_auth_user "$uid"
  done <<< "$STALE_USER_IDS"

  log "Deleting stale operator/conductor rows from user-service DB..."
  psql_user -c "
    DELETE FROM users WHERE user_type_id IN (
      SELECT id FROM user_types WHERE name IN ('operator','conductor')
    );
  "
else
  log "No existing operator/conductor accounts found."
fi

psql_user -c "DELETE FROM operator_sync_outbox;" >/dev/null 2>&1 || true

# ── Phase 3: seed operators ─────────────────────────────────────────────────

log "Creating operator 1/3: Lanka Suwaseriya Travels (Pvt) Ltd..."
read -r OP1_USER_ID OP1_CORE_ID <<< "$(create_operator_account \
  "operator.suwaseriya@busmate.test" "Operator1@2026" "Nimal Perera" "suwaseriya.travels" \
  "+94771234501" "Lanka Suwaseriya Travels (Pvt) Ltd" "PVT/WP/2024/00145" "PRIVATE" "Western Province")"

log "Creating operator 2/3: Southern Comfort Express..."
read -r OP2_USER_ID OP2_CORE_ID <<< "$(create_operator_account \
  "operator.southerncomfort@busmate.test" "Operator2@2026" "Kumari Wijesinghe" "southern.comfort" \
  "+94771234502" "Southern Comfort Express (Pvt) Ltd" "PVT/SP/2024/00278" "PRIVATE" "Southern Province")"

log "Creating operator 3/3: Sri Lanka Transport Board - Central Province..."
read -r OP3_USER_ID OP3_CORE_ID <<< "$(create_operator_account \
  "operator.sltbcentral@busmate.test" "Operator3@2026" "Sunil Rathnayake" "sltb.central" \
  "+94771234503" "Sri Lanka Transport Board - Central Province" "CTB/CP/2024/00012" "CTB" "Central Province")"

log "Operators created: $OP1_CORE_ID / $OP2_CORE_ID / $OP3_CORE_ID"

# ── Phase 4: seed conductors ────────────────────────────────────────────────

log "Creating conductor 1/2: Saman Kumara (assigned to Suwaseriya Travels)..."
create_conductor_account \
  "conductor.saman@busmate.test" "Conductor1@2026" "Saman Kumara" "saman.kumara" \
  "+94771234511" "EMP-CND-1001" "199045612345" "$OP1_CORE_ID" >/dev/null

log "Creating conductor 2/2: Nirosha Fernando (assigned to Southern Comfort Express)..."
create_conductor_account \
  "conductor.nirosha@busmate.test" "Conductor2@2026" "Nirosha Fernando" "nirosha.fernando" \
  "+94771234512" "EMP-CND-1002" "199267890123" "$OP2_CORE_ID" >/dev/null

# ── Phase 5: seed buses (2 per operator) ────────────────────────────────────

log "Creating buses..."
create_bus "$OP1_CORE_ID" "WP-PVT-1001" "WP CAA-4521" 52 "TATA LP 1613"
create_bus "$OP1_CORE_ID" "WP-PVT-1002" "WP CAB-7734" 45 "Ashok Leyland Viking"
create_bus "$OP2_CORE_ID" "SP-PVT-1001" "SP CAA-2210" 49 "Rosa Coaster"
create_bus "$OP2_CORE_ID" "SP-PVT-1002" "SP CAB-9981" 40 "Yutong ZK6122"
create_bus "$OP3_CORE_ID" "CP-SLTB-1001" "CP NA-1123" 55 "TATA LP 1613 (SLTB)"
create_bus "$OP3_CORE_ID" "CP-SLTB-1002" "CP NA-1187" 55 "TATA LP 1613 (SLTB)"

# ── Phase 6: seed permits (one per operator, against existing route groups) ─

log "Creating passenger service permits..."
create_permit "$OP1_CORE_ID" "66666666-6666-6666-6666-666666666664" "PVT-SUW-2026-001" "SEMI_LUXURY" 2
create_permit "$OP2_CORE_ID" "66666666-6666-6666-6666-666666666662" "PVT-SCE-2026-001" "LUXURY" 2
create_permit "$OP3_CORE_ID" "66666666-6666-6666-6666-666666666661" "SLTB-CP-2026-001" "NORMAL" 2

log "Done. See docs/operator-conductor-seed-credentials.md for login details."
