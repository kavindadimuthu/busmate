# Self-Hosted Authentication Migration Plan (user-service)

**Goal:** Move authentication off Supabase (GoTrue) and own it inside `apps/backend/user-service`,
while keeping RBAC/permissions/profile (already built there) unchanged and preserving the external
API contract the api-gateway already depends on.

**Status:** Phase 1 complete (local password auth + credential store). Phase **2a** complete
(stored, rotating, reuse-detected refresh tokens + revocation). Phase **2b** complete (RS256 +
JWKS, all verifiers switched). Phase **3** complete (email verify/reset in-house). Phase **4**
complete (passenger-only social login, find-or-link). Phases 5–7 pending.

> **Phase 4 as-built notes (2026-07-16):**
> - New `POST /api/auth/social/{provider}` (`provider` = `google` or `facebook`), permitted
>   unauthenticated in `SecurityConfig` alongside `/register`/`/login`. Body carries only the
>   provider's own signed ID token (`SocialLoginRequest.idToken`) — the mobile/SPA app does the
>   interactive OAuth dance itself and hands this service the result.
> - `SocialIdentityVerifier` / `JwtSocialIdentityVerifier` verify that token against the
>   provider's *own* JWKS (`NimbusJwtDecoder`, from the new `spring-boot-starter-oauth2-resource-server`
>   dependency — only its decoder classes are used; the resource-server auto-configuration backs
>   off because a `SecurityFilterChain` bean already exists), checking signature + issuer + audience
>   + expiry, then extracts `sub`/`email`/`email_verified`. One decoder built lazily per provider
>   and cached, so an unconfigured provider never triggers a JWKS fetch at startup.
> - `AuthService.socialLogin` find-or-link, in order: (1) an existing `user_identities` row for
>   `(provider, subject)` logs straight in; (2) otherwise a `users` row matching the token's email
>   gets a new identity linked to it; (3) otherwise a brand-new **passenger** account is created —
>   active and email-verified immediately (the provider already vouches for the email), with no
>   `auth_credentials` row at all. Reused `startSession`/`ensureLoginAllowed` from the password
>   login path so blocked accounts (suspended/deactivated/deleted) are rejected the same way.
> - **Audience enforcement:** `ensurePassengerAudience` rejects (403) any match against a
>   non-passenger account — staff/operator/conductor accounts are provisioned and must keep using
>   email/password; social login can never silently link to one of them via a shared email.
> - Config: `auth.social.{google,facebook}.{client-id,issuer,jwks-uri}`; `client-id` defaults blank,
>   in which case that provider's endpoint throws a clear config error the first time it's actually
>   called rather than failing app startup. `issuer`/`jwks-uri` default to each provider's real
>   well-known endpoints (Google's OIDC issuer/JWKS; Facebook's Limited-Login OIDC JWKS — Facebook's
>   *classic* Graph API access tokens are opaque, not JWTs, so this assumes the client uses
>   Facebook's OIDC-flavored login, matching the plan's "verify against the provider's JWKS" design).
> - Tests: `JwtSocialIdentityVerifierTest` runs the verifier against a real local JWKS endpoint
>   (JDK's `com.sun.net.httpserver.HttpServer`, same rationale as the gateway's jose-v4 JWKS tests in
>   Phase 2b — a mocked HTTP client wouldn't exercise `NimbusJwtDecoder`'s actual fetch path) —
>   covers accept, wrong-audience, wrong-issuer, expired, unsupported-provider, and
>   unconfigured-provider. `AuthControllerTest` mocks `SocialIdentityVerifier` itself and covers the
>   find-or-link/audience/blocked-account business logic end-to-end: new-passenger creation,
>   linking-by-email, returning via a stored identity, rejecting a non-passenger match, rejecting a
>   blocked account, and propagating a bad token as 401.
> - **Not done:** no admin-facing "list/unlink my social identities" endpoint yet; no test/support
>   for a passenger having multiple identities of the *same* provider (not a real scenario) or
>   converting a social-only account to add a password later (`CredentialService.updatePassword`
>   already supports it — creating the missing `auth_credentials` row — just nothing calls it yet).

> **Phase 3 as-built notes (2026-07-16):**
> - Added table `one_time_tokens` (`OneTimeToken`/`OneTimeTokenType`/`OneTimeTokenRepository`) —
>   same pattern as `refresh_tokens`: the raw token is never stored, only its SHA-256 hash;
>   single-use via `consumedAt`. New `OneTimeTokenService` issues (30 min TTL for password-reset,
>   24 h for email-verify) and consumes them, and burns any still-usable token of the same type
>   before issuing a new one — a second "forgot password" click kills the first email's link.
> - Extracted `security/OpaqueTokenGenerator` (generate + SHA-256 hash) out of `RefreshTokenService`
>   so `OneTimeTokenService` doesn't duplicate that logic; `RefreshTokenService` itself now delegates
>   to it too (behavior-preserving refactor, still covered by its existing Phase 2a tests).
> - New `EmailService` (`spring-boot-starter-mail`) sends the two auth emails. When
>   `spring.mail.host` is blank (the default), it logs the would-be email instead of sending, so
>   local dev/CI need zero setup. Because Spring Boot's own mail autoconfiguration only registers a
>   `JavaMailSender` bean once `spring.mail.host` is *non-blank*, a new `MailConfig` constructs the
>   bean unconditionally itself — otherwise `EmailService`'s constructor injection fails to start at
>   all whenever no SMTP is configured.
> - `AuthService.forgotPassword` / `resetPassword` / `verifyEmail` are now fully local (no more
>   Supabase calls in `AuthService` at all — `SupabaseAuthClient` remains only for `UserService`'s
>   suspend/unsuspend calls, Phase 5's territory). `registerPassenger` and `createUser` now send a
>   verification email; email failures during registration/forgot-password are caught and logged,
>   never surfaced as a 500 (registration must still succeed, and forgot-password must always
>   return 200 regardless, for the no-enumeration guarantee).
> - **Link targets are a placeholder:** `auth.email.reset-password-url` / `verify-email-url`
>   default to `http://localhost:3000/{reset-password,verify-email}` — no frontend actually has
>   these pages yet in any app. Override via env vars once one does; `?token=<raw token>` is
>   appended automatically.
> - **Bug found and fixed, pre-existing since Phase 1/2a:** `CredentialService.updatePassword`
>   left its change unflushed in the persistence context; every caller (`changePassword`, and now
>   `resetPassword`) follows it with a `RefreshTokenService` revocation, whose bulk
>   `@Modifying(clearAutomatically = true)` query calls `entityManager.clear()` — which, without an
>   explicit flush first, silently discarded the still-pending password change before it ever
>   reached the database. `changePassword` had this exact latent bug since Phase 1 with no test
>   catching it. Fixed by having `CredentialService` use `saveAndFlush`; added a regression test for
>   both flows (`resetPasswordChangesThePasswordAndRevokesSessions`,
>   `changePasswordActuallyPersistsAndRevokesSessions`).
> - **Not done:** rate limiting on `/forgot-password` (plan §3, still pending); `auth_audit_log`
>   writes for these flows (explicitly Phase 5's scope).

> **Phase 2b as-built notes (2026-07-16):**
> - **user-service:** `JwtKeyConfig`/`RsaKeyMaterial` load an RSA keypair from
>   `AUTH_JWT_RSA_PRIVATE_KEY`/`AUTH_JWT_RSA_PUBLIC_KEY` (PEM), or generate an **ephemeral** one if
>   unset — fine for a single local-dev instance, but every multi-instance/production environment
>   MUST set real keys (see the loud startup WARN and `.env.example`), or different instances mint
>   tokens no one else can verify. `TokenService` now signs RS256 with a `kid` header.
>   `GET /public/jwks.json` (new `JwksController`) publishes the public half.
> - **New shared `AccessTokenVerifier`** (used by both `JwtAuthFilter` and
>   `InternalService.validateToken`): resolves the verification key from the JWT header's
>   algorithm via a jjwt `SigningKeyResolver` — RS256 → the RSA public key, HS256 → the legacy
>   `auth.jwt.secret`. This **is** the dual-accept grace window from §6, not a separate flag.
> - **api-gateway:** new `src/auth/tokenVerifier.ts` does the same dual-algorithm verification
>   (via `jose`'s `createRemoteJWKSet` against `${USER_SERVICE_URL}/public/jwks.json` for RS256,
>   `jsonwebtoken` + the shared secret for legacy HS256). `auth.middleware.ts` and
>   `bff/session.ts`'s `isAccessTokenValid` both became **async** to support the JWKS fetch — their
>   two callers in `bff/auth.routes.ts` were already inside async handlers, so this was a
>   non-breaking signature change. Added a new gateway route, `/public/jwks.json` → USER_SERVICE
>   (unauthenticated) — the management portal never talks to user-service directly, only to this
>   gateway, so it needs a passthrough to reach the JWKS document at all.
> - **management-portal:** new `src/lib/auth/tokenVerifier.ts`, same dual-algorithm approach,
>   fetching JWKS through the gateway's new passthrough route. `proxy.ts`, `token/route.ts`, and
>   `getDecodedAccessToken.ts` now call it instead of raw `jwt.verify`.
> - **Dependency note:** `jose` v5+ dropped CommonJS support (ESM-only), but both the gateway
>   (ts-jest/tsc → CommonJS) and the portal need a `require()`-able build — pinned both to
>   **`jose@^4.15.9`**, the last version with a genuine dual CJS/ESM build, rather than converting
>   either app's module system to ESM.
> - **Tests:** user-service gained `AccessTokenVerifierTest` (RS256 accept, legacy HS256 accept,
>   wrong-secret reject, expired reject, garbage reject) and `JwksControllerTest` (proves the
>   published JWK actually verifies a real login-issued token — reconstructs an `RSAPublicKey` from
>   the endpoint's `n`/`e` and checks its `kid` matches the token header). The gateway's
>   `auth.middleware.test.ts` now covers both RS256 (current) and HS256 (legacy) tokens, using a
>   real local HTTP server to stand in for user-service's JWKS endpoint — `jose@4`'s remote-JWKS
>   fetcher uses Node's `http`/`https` modules directly (it predates Node's Fetch API), so mocking
>   `global.fetch` doesn't intercept it; a real listener is both simpler and more faithful.
> - **Not done / left for a real cutover:** no dual-window *time limit* is enforced — the HS256
>   branch simply stays until someone removes it once satisfied no HS256 tokens remain (one
>   `access-token-ttl-seconds` window after every environment has real RSA keys configured and has
>   redeployed). `logout`'s "log out everywhere" limitation from Phase 2a is unchanged.

> **Phase 1 as-built notes (2026-07-16):**
> - Added tables `auth_credentials` and `user_identities` (Hibernate `ddl-auto: update`); the
>   `refresh_tokens` / `one_time_tokens` / `auth_audit_log` tables stay deferred to their phases.
> - `PasswordConfig` (bcrypt via DelegatingPasswordEncoder, Supabase-hash compatible),
>   `CredentialService`, and `TokenService` (see the deviation below) are new.
> - `AuthService.registerPassenger` / `createUser` / `login` / `refresh` / `changePassword` are
>   fully local — the Supabase dual-write and `rollBackOrphanedSupabaseUser` are gone.
> - **Deviation from plan:** to keep login working now (rather than waiting for Phase 2), Phase 1
>   issues HS256 JWTs signed with the existing `auth.jwt.secret` (defaults to `SUPABASE_JWT_SECRET`)
>   and reproduces GoTrue's `app_metadata` claim shape, so the gateway + `JwtAuthFilter` verify
>   unchanged. Refresh tokens are stateless JWTs here. Phase 2 still owns the RS256/JWKS upgrade
>   **and** the opaque, stored, rotating refresh tokens with real revocation.
> - **Still on Supabase until Phase 3:** `forgot-password` / `reset-password` / `verify-email`
>   (marked `TODO(Phase 3)` in `AuthService`). `logout` is a documented no-op until Phase 2.
> - Not started here: rate limiting / lockout (columns exist on `auth_credentials`, unenforced).

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
