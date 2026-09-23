#!/usr/bin/env bash
# Creates the FIRST admin account on a production stack (INC-032).
#
#   scripts/bootstrap-admin.sh <email> "<Full Name>"
#
# Run on the production host, from the repository root, once the stack is up. Production has no
# seed data — the dev demo accounts live in db/seed/dev and are deliberately absent — so without
# this there is no way to sign in to the staff portal at all. Every later account is created
# through the portal by an admin; this exists only to break that chicken-and-egg.
#
# It refuses to run if an admin already exists, so it cannot be used later to mint a second
# back-door admin. The generated password is written to a private file, never printed: terminal
# output ends up in scrollback, CI logs and chat transcripts.

set -euo pipefail

EMAIL="${1:?usage: bootstrap-admin.sh <email> \"<Full Name>\"}"
NAME="${2:?usage: bootstrap-admin.sh <email> \"<Full Name>\"}"

cd "$(dirname "$0")/.."
COMPOSE=(docker compose --env-file config/secrets/.env -f docker-compose.production.yml)
psql_user() { "${COMPOSE[@]}" exec -T postgres psql -U postgres -d busmate_user -v ON_ERROR_STOP=1 "$@"; }

EXISTING="$(psql_user -tA -c "SELECT count(*) FROM users u JOIN user_types t ON t.id = u.user_type_id WHERE t.name = 'admin'")"
if [ "$EXISTING" != "0" ]; then
  echo "REFUSING: $EXISTING admin account(s) already exist. Create further accounts through the portal." >&2
  exit 1
fi

# 16 unambiguous alphanumerics (no 0/O/1/l/I to misread), plus a fixed tail that guarantees an upper,
# a lower, a digit and a symbol whatever policy the service applies.
# Not `tr … </dev/urandom | head -c 16`: head closes the pipe, tr dies of SIGPIPE, and pipefail turns
# that into a silent exit 141 before anything is written.
RAW="$(head -c 96 /dev/urandom | base64 | LC_ALL=C tr -dc 'A-HJ-NP-Za-km-z2-9')"
PASSWORD="${RAW:0:16}#7Kx"

# BCryptPasswordEncoder, cost 10, as user-service uses. The {bcrypt} prefix is Spring's
# DelegatingPasswordEncoder id; without it the stored hash is not recognised at login.
HASH="{bcrypt}$(python3 -W ignore -c 'import crypt,sys; print(crypt.crypt(sys.argv[1], crypt.mksalt(crypt.METHOD_BLOWFISH, rounds=1024)))' "$PASSWORD")"
case "$HASH" in '{bcrypt}$2'*) ;; *) echo "bcrypt hashing failed; nothing was written" >&2; exit 1 ;; esac

USERNAME="$(printf '%s' "$NAME" | tr '[:upper:] ' '[:lower:].' | tr -cd 'a-z0-9.')"

psql_user -v email="$EMAIL" -v name="$NAME" -v username="$USERNAME" -v hash="$HASH" <<'SQL'
BEGIN;
WITH u AS (
    INSERT INTO users (user_id, email, full_name, username, user_type_id,
                       account_status, is_email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), :'email', :'name', :'username',
            (SELECT id FROM user_types WHERE name = 'admin'),
            'active', true, now(), now())
    RETURNING user_id
), c AS (
    INSERT INTO auth_credentials (user_id, password_hash, failed_attempts,
                                  password_updated_at, created_at, updated_at)
    SELECT user_id, :'hash', 0, now(), now(), now() FROM u
)
INSERT INTO user_profiles (id, user_id, profile_data, created_at, updated_at)
SELECT gen_random_uuid(), user_id, '{}'::jsonb, now(), now() FROM u;
COMMIT;
SQL

OUT="$HOME/.busmate-admin-initial-password"
( umask 077; printf '%s\n' "$PASSWORD" > "$OUT" )

echo "Admin created: $EMAIL"
echo "Initial password saved to: $OUT  (mode 600)"
echo "Read it once, sign in, change it, then delete that file."
