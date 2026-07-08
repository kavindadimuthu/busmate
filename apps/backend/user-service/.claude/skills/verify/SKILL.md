---
name: verify
description: Run and manually exercise user-management's real HTTP endpoints against the live Supabase project (no local DB/Kafka needed for the core flows)
---

# Verifying user-management

## Launch (no Docker needed for a quick check)

The repo-root `.env` has real values for `SPRING_DATASOURCE_URL` etc. **Do not `source .env` or `set -a && source .env` directly** — `SPRING_DATASOURCE_URL`'s value contains unescaped `&` (query params), which bash's `source`/job-control parses as backgrounded commands, silently dropping the variable. (This only bites shell-sourcing; `docker compose --env-file` parses it fine since it isn't a shell interpreter.)

Use this loader instead:

```bash
cd /path/to/busmate
set -a
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  key="${line%%=*}"; value="${line#*=}"
  export "$key=$value"
done < .env
set +a

cd apps/backend/user-management
nohup ./mvnw -q spring-boot:run > /tmp/user-mgmt.log 2>&1 < /dev/null &
disown
# ~10s to start (real Supabase Postgres connection). Poll:
until curl -sf http://localhost:8081/api/auth/login -X POST -H 'Content-Type: application/json' -d '{}' -o /dev/null; do sleep 2; done
```

Note: `GET /actuator/health` returns **403**, not 200 — `SecurityConfig` doesn't permit `/actuator/**`, so don't use it as the readiness probe (and note this is the same endpoint `docker-compose.yml`'s healthcheck uses — that healthcheck will never pass as currently configured). Poll a real endpoint instead, as above.

No local Kafka broker is needed to test the HTTP surface: `spring.kafka.bootstrap-servers` defaults to `localhost:9092`; if nothing's listening there, event publishing fails with logged `WARN`/`ERROR` (`o.apache.kafka.clients.NetworkClient`, `o.s.k.s.LoggingProducerListener`) but never blocks or fails the HTTP response — this is by design (best-effort publish-and-swallow).

## Drive the real flows

```bash
BASE=http://localhost:8081

# Register (creates a REAL row in the live Supabase project — use an obviously-fake email)
curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"...@example.com","password":"...","fullName":"...","username":"...","phoneNumber":"..."}'

# Login → accessToken is a real Supabase JWT; decode payload (no verification needed) to inspect
# claims: `sub` = userId (not email — Phase 4's principal change), `app_metadata.user_type`.
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"..."}'

# Protected endpoint
curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"

# Permission-gated admin endpoint (expect 403 for a plain passenger token)
curl -s $BASE/api/users?user_type=passenger -H "Authorization: Bearer $TOKEN"

# Internal API-key-gated endpoints (need INTERNAL_API_KEY from .env)
curl -s $BASE/internal/users/$USER_ID -H "X-Internal-Api-Key: $INTERNAL_API_KEY"
curl -s -X POST $BASE/internal/auth/check-permission -H "X-Internal-Api-Key: $INTERNAL_API_KEY" \
  -H 'Content-Type: application/json' -d '{"user_id":"'$USER_ID'","permission":"profile:read:own"}'
```

## Known gaps as of 2026-07-08 (confirmed by running the app, not just reading code)

- Duplicate-email registration and wrong-password login both return a bare `500 {"error":"Internal server error"}` instead of 409/401 — `SupabaseAuthClient` wraps every non-2xx Supabase response in a generic `RuntimeException` (`"Supabase signup/login failed: " + body`), discarding Supabase's `error_code`, so `GlobalExceptionHandler`'s catch-all is the only thing that ever handles it.
- Missing `Authorization` header → 403; an invalid/garbage token → 401 (inconsistent — `JwtAuthFilter` only sets 401 inside its `catch (JwtException)` branch; a request with no header at all skips that branch entirely and falls through to Spring Security's default anonymous-access denial, which resolves to 403).
- `/actuator/**` isn't in `SecurityConfig`'s permit-list — breaks the `docker-compose.yml` healthcheck (see above).
