# Self-Hosted Authentication Migration Plan (user-service)

**Goal:** Move authentication off Supabase (GoTrue) and own it inside `apps/backend/user-service`,
while keeping RBAC/permissions/profile (already built there) unchanged and preserving the external
API contract the api-gateway already depends on.

**Status:** Draft / not started.

---

## 0. Guiding principles & key facts

- **The external contract barely changes.** The api-gateway talks to user-service over
  `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout` and verifies the JWT
  itself. We keep those endpoints and their shapes; we swap the *internals* (Supabase → local).
- **RBAC stays.** `Permission`, `UserType`, `UserTypePermission`, `UserPermissionOverride`,
  `PermissionService`, `PermissionCheckAspect` are untouched.
- **`users.user_id` (UUID) stays canonical.** Today it's set from Supabase's UID. New users get a
  server-generated UUID. Existing users keep their Supabase UID (imported), so all FKs survive.
- **Passwords carry over.** Supabase stores **bcrypt** (`$2a$`) hashes; Spring's
  `BCryptPasswordEncoder` verifies them directly — no forced re-login for password users.
- **Upgrade the token model** from HS256 shared-secret to **RS256 + JWKS** so no service holds a
  signing secret (gateway/services verify with a public key).

---

## 1. Data model (new tables — Hibernate `ddl-auto: update` will create them)

Keep credentials/identities/sessions **separate** from the `users` profile row.

### `auth_credentials`  (email/password secret — 1:1 with users)
| column | type | notes |
|---|---|---|
| user_id | uuid PK/FK → users | |
| password_hash | text | bcrypt now; `{bcrypt}`/`{argon2}` prefix via DelegatingPasswordEncoder |
| password_updated_at | timestamptz | |
| failed_attempts | int default 0 | for lockout |
| locked_until | timestamptz null | |

> Users who only sign in via social have **no** row here.

### `user_identities`  (federated + local logins; enables account linking)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| provider | text | `local` \| `google` \| `facebook` |
| provider_user_id | text | provider `sub` (for `local`, = email) |
| email | text | email seen at link time |
| linked_at | timestamptz | |
|  | unique(provider, provider_user_id) | one identity per provider account |

### `refresh_tokens`  (rotation + revocation)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| token_hash | text | store SHA-256 of the opaque token, never the token |
| family_id | uuid | rotation lineage; reuse of a rotated token revokes the whole family |
| issued_at / expires_at | timestamptz | |
| revoked_at | timestamptz null | |
| user_agent / ip | text | audit |

### `one_time_tokens`  (email verify + password reset)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | `email_verify` \| `password_reset` |
| token_hash | text | SHA-256 of the emailed token |
| expires_at | timestamptz | short TTL (e.g. 30 min reset, 24 h verify) |
| consumed_at | timestamptz null | single-use |

### `auth_audit_log`  (append-only)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid null | null for failed login on unknown email |
| event_type | text | `login_success`, `login_failure`, `token_refresh`, `password_reset`, `account_suspended`, `social_link`, … |
| ip / user_agent | text | |
| metadata | jsonb | provider, reason, etc. |
| created_at | timestamptz | |

> Feed this from the existing `UserEventPublisher`/outbox where it makes sense so activity
> tracking and audit share one pipeline.

---

## 2. Component build-out (phased)

### Phase 1 — Password auth in-house
- Add `PasswordEncoder` bean: `DelegatingPasswordEncoder` defaulting to bcrypt (Supabase-compatible).
- New `CredentialService`: create/verify/update password against `auth_credentials`.
- Rework `AuthService`:
  - `registerPassenger` / `createUser` → generate UUID locally, hash password, write
    `users` + `auth_credentials` + `user_identities(provider=local)` in **one @Transactional** unit.
    This **deletes the dual-write** and `rollBackOrphanedSupabaseUser` compensation entirely.
  - `login` → look up by email, verify hash, check `account_status`, update `last_login_at`,
    issue tokens (Phase 2), audit.
  - `changePassword` → verify current hash locally (no more Supabase round-trip).
- Delete `SupabaseAuthClient`, `SupabaseAuthException`, and the `client/dto/Supabase*` DTOs at the
  end of the migration (keep until cutover for rollback).

### Phase 2 — Token service (RS256 + refresh rotation)
- New `TokenService`:
  - **Access token (JWT, RS256, ~15 min):** claims `sub`=userId, `email`, and — to keep the gateway
    and `JwtAuthFilter` working with minimal change — a nested `app_metadata.{user_type,account_status}`
    matching today's shape. Keep permissions **out** of the token (fetched via `/me`), so tokens stay small.
  - **Refresh token (opaque random, ~30 days):** stored hashed in `refresh_tokens`, **rotated** on
    every `/refresh`; detect reuse of a rotated token → revoke the whole `family_id` (theft response).
  - `logout` → revoke the presented refresh token's family (real revocation, unlike stateless-only).
- Generate an RSA keypair; keep the private key in `config/secrets` (env-injected). Publish the public
  key as JWKS at `GET /public/jwks.json` (already permit-listed under `/public/**` in `SecurityConfig`).

### Phase 3 — Email flows (verify + reset)
- Add `spring-boot-starter-mail` (SMTP) **or** an HTTP provider (Resend/SES/SendGrid). Config in
  `config/secrets`.
- `forgotPassword` → create `one_time_tokens(password_reset)`, email a link/code, **always** return 200
  (no account enumeration).
- `resetPassword` → validate+consume token, set new hash, revoke all refresh tokens for that user.
- `verifyEmail` → validate+consume `email_verify` token, set `users.is_email_verified = true`.
- Send the verify email at end of registration.

### Phase 4 — Social login (passengers only)
- Recommended pattern for the mobile/SPA passenger apps: **verify the provider ID token server-side**
  (mobile SDK obtains Google/Facebook `id_token` → POST to `/api/auth/social/{provider}`):
  - Verify signature against the provider's JWKS, check `aud`/`iss`/`exp`, extract `sub` + `email`.
  - **Find-or-link:** if `user_identities(provider, sub)` exists → log in. Else if a user with that
    **email** exists → link a new identity to it. Else → create a new **passenger** user
    (no `auth_credentials` row) + identity.
  - Issue our own tokens (Phase 2).
- **Enforce audience:** reject social login for non-passenger emails/accounts — staff/operator/conductor
  accounts are provisioned and must use email/password. (Later: per-operator enterprise **OIDC SSO**,
  which is the opposite of consumer social login.)
- Deps: `spring-boot-starter-oauth2-client` for web authorization-code flow, or just `jjwt`/Nimbus for
  ID-token verification if mobile SDKs do the interactive part.

### Phase 5 — Account management + audit + activity
- Replace Supabase admin calls with local operations:
  - **Suspend** → `account_status = suspended` + revoke all refresh tokens (kills live sessions;
    the gateway already 403s on `account_status = suspended`).
  - **Deactivate** → `account_status = deactivated`, block login, keep data.
  - **Delete** → soft-delete (`account_status = deleted`) + purge `auth_credentials`/`user_identities`;
    optional hard-delete job for GDPR-style erasure.
- Wire `auth_audit_log` writes into login/refresh/reset/social/account-status transitions.
- Activity tracking: reuse `UserEventPublisher` (Kafka) so audit + downstream consumers share one stream.

---

## 3. Cross-cutting hardening
- **Rate limiting / lockout** on `/login`, `/forgot-password`, `/refresh` (bucket per IP + per email;
  `failed_attempts`/`locked_until` on `auth_credentials`).
- **No account enumeration** on register/forgot/verify responses.
- **Password policy** (length/complexity) validated on register/reset/change.
- **Secrets**: RSA private key + SMTP creds in `config/secrets`, never in the JWT or repo.
- **CORS/CSRF** unchanged (bearer tokens, CSRF already disabled for the API).

## 4. Gateway & downstream verification switch
- api-gateway `auth.middleware.ts` and `bff/session.ts`: switch `jwt.verify` from
  `SUPABASE_JWT_SECRET`/HS256 to **RS256 with the JWKS public key** (fetch+cache `/public/jwks.json`).
  Because we keep the `app_metadata` claim shape, the rest of the middleware (suspended check,
  `x-user-*` headers) is unchanged.
- user-service `JwtAuthFilter`: verify with the RSA **public key** instead of the HS256 shared secret.
- Any other service that trusted the shared secret → move to JWKS/public-key verification.

## 5. Data migration from Supabase
Export from Supabase `auth.users` and load into the new tables (UUIDs already match `users.user_id`):
| Supabase source | → target |
|---|---|
| `id` | already in `users.user_id` (verify parity) |
| `encrypted_password` | `auth_credentials.password_hash` (bcrypt, as-is) |
| `email_confirmed_at` | `users.is_email_verified` |
| `banned_until` | `users.account_status = suspended` if in the future |
| `raw_app_meta_data.user_type` | already in `users.user_type` (verify) |
| (each user) | seed `user_identities(provider='local', provider_user_id=email)` |

- Reconcile any drift between `users` and `auth.users` before cutover (there's a
  `scripts/migrate-supabase-metadata.ts` already — extend/reuse it).

## 6. Cutover strategy
- Build everything behind a flag; keep `SupabaseAuthClient` compilable until the end for rollback.
- **Sessions at cutover:** simplest is a one-time **forced re-login** (old HS256 tokens stop being
  accepted). If that's unacceptable, run a short **grace window** where verifiers accept *either*
  HS256 (old) or RS256 (new); expire it after the max refresh-token lifetime.
- Order: deploy new tables + token/JWKS endpoint → migrate data → flip user-service AuthService to
  local → flip gateway/services to JWKS → monitor → decommission.

## 7. Decommission
- Remove `SupabaseAuthClient` + DTOs + `supabase.*` config from user-service, gateway, and
  `config/secrets`. Cancel the Supabase project once production is stable.

---

## Deliverables checklist
- [ ] New entities/repos: credentials, identities, refresh tokens, one-time tokens, audit log
- [ ] `PasswordEncoder` + `CredentialService`
- [ ] `TokenService` (RS256 issue/verify, refresh rotation, revocation) + `/public/jwks.json`
- [ ] Email provider + verify/reset flows on `one_time_tokens`
- [ ] Social login endpoint(s), passenger-only, find-or-link
- [ ] Account suspend/deactivate/delete → local + session revocation
- [ ] Rate limiting / lockout / password policy
- [ ] Gateway + `JwtAuthFilter` + services → JWKS verification
- [ ] Supabase data export/import + reconciliation
- [ ] Cutover + decommission Supabase
