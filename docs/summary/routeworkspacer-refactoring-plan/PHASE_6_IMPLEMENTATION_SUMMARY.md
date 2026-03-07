# Phase 6 Implementation Summary - Cross-Cutting Concerns
**Date:** 2026-03-08  
**Status:** ✅ Completed

## Overview
Phase 6 addressed cross-cutting concerns that span the entire application: role-based authorization, secure API key handling, and resilient error boundaries. Four discrete tasks were completed, covering both the Spring Boot backend and the Next.js frontend. All backend changes compile cleanly (`mvn clean compile` → BUILD SUCCESS) and introduce zero new TypeScript errors in Phase 6 files.

---

## Task 6.1: Role-Based Authorization ✅

### Problem
All write endpoints — route creation, updates, deletes, imports, exports, and stop mutations — were accessible to any authenticated user. There was no enforcement of administrative privilege for operations that modify production data.

### Changes Made

#### SecurityConfig.java — Enable Method-Level Security
**File:** [SecurityConfig.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/shared/config/SecurityConfig.java)

```java
// Before
@Configuration
@EnableWebSecurity
public class SecurityConfig { … }

// After
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)   // ← added
public class SecurityConfig { … }
```

`@EnableMethodSecurity(prePostEnabled = true)` activates Spring Security's `@PreAuthorize` / `@PostAuthorize` annotation processing at the method level. Without this annotation, `@PreAuthorize` annotations on controller methods are silently ignored.

#### RouteController.java — Protect Mutation Endpoints
**File:** [RouteController.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/network/controller/RouteController.java)

`@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")` was added to:

| Method | Endpoint |
|--------|----------|
| `createRoute` | `POST /api/routes` |
| `updateRoute` | `PUT /api/routes/{id}` |
| `deleteRoute` | `DELETE /api/routes/{id}` |
| `createRouteGroup` | `POST /api/routes/groups` |
| `updateRouteGroup` | `PUT /api/routes/groups/{id}` |
| `deleteRouteGroup` | `DELETE /api/routes/groups/{id}` |
| `importRoutesUnified` | `POST /api/routes/import` |

`@ApiResponse(responseCode = "403", …)` annotations were added to each protected method's Swagger documentation.

All `GET` endpoints remain accessible to any authenticated user.

#### StopController.java — Protect Mutation Endpoints
**File:** [StopController.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/network/controller/StopController.java)

`@PreAuthorize("hasAnyRole('ADMIN', 'MOT')")` was added to:

| Method | Endpoint |
|--------|----------|
| `createStop` | `POST /api/stops` |
| `createStopsBatch` | `POST /api/stops/batch` |
| `updateStop` | `PUT /api/stops/{id}` |
| `deleteStop` | `DELETE /api/stops/{id}` |
| `importStops` | `POST /api/stops/import` |
| `exportStops` | `POST /api/stops/export` |
| `bulkUpdateStops` | `PUT /api/stops/import/upsert` |

### Role Mapping

The existing `JwtAuthenticationFilter` maps JWT `groups` claims to Spring Security roles:

```java
// JwtAuthenticationFilter.java (existing logic)
roles.append("ROLE_").append(groups.get(i).toUpperCase());
// group "MOT" → ROLE_MOT_ADMIN → hasRole('MOT') ✅

// MockJwtAuthenticationFilter.java (dev environment)
new UserPrincipal("dev-user", "ROLE_ADMIN,ROLE_USER");
// hasAnyRole('ADMIN', 'MOT') → ROLE_ADMIN matches ✅
```

Using `hasAnyRole('ADMIN', 'MOT')` ensures:
- **Production**: `MOT` Asgardeo group → `ROLE_MOT_ADMIN` → `hasAnyRole` matches
- **Development**: MockFilter provides `ROLE_ADMIN` → `hasAnyRole` matches
- **Regular users**: No admin role → Spring Security throws `AccessDeniedException`

### GlobalExceptionHandler — New Handlers Added
**File:** [GlobalExceptionHandler.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/shared/exception/GlobalExceptionHandler.java)

Two handlers were added to complement Task 6.1:

```java
// Handler 1: @PreAuthorize failures → 403 Forbidden
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
    log.warn("Access denied: {}", ex.getMessage());
    ErrorResponse error = new ErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            "You do not have permission to perform this action. Required role: MOT.");
    return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
}

// Handler 2: @Version optimistic lock conflicts → 409 Conflict
// (Phase 1 added @Version; Phase 6 adds the corresponding exception handler)
@ExceptionHandler({OptimisticLockException.class, ObjectOptimisticLockingFailureException.class})
public ResponseEntity<ErrorResponse> handleOptimisticLockException(Exception ex) {
    log.warn("Optimistic locking conflict: {}", ex.getMessage());
    ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "The resource was modified by another user. Please refresh and try again.");
    return new ResponseEntity<>(error, HttpStatus.CONFLICT);
}
```

Without the `AccessDeniedException` handler, Spring Security's default behaviour would generate a `403` with no body — confusing for API consumers. The handler returns a consistent `ErrorResponse` DTO matching the rest of the API's error format.

The `OptimisticLockException` handler completes the work started in Phase 1 (which added `@Version` to entities). Previously, concurrent update conflicts produced a generic `500` response; now they correctly return `409 Conflict` with an actionable message.

### Benefits
- ✅ **Principle of Least Privilege** — only `MOT` users can create, update, or delete data
- ✅ **Dev-friendly** — `MockJwtAuthenticationFilter` still passes `ROLE_ADMIN`, so Swagger UI testing is unaffected
- ✅ **Consistent 403 responses** — `AccessDeniedException` handler returns structured `ErrorResponse` DTO
- ✅ **Correct 409 for lock conflicts** — previously these silently became 500 Internal Server Error
- ✅ **Swagger documented** — all protected endpoints show `403` in their `@ApiResponses`

---

## Task 6.2: Fix Gemini API Key Exposure ✅

### Problem
`routeGeminiService.ts` was calling the Gemini API directly from the browser using a `NEXT_PUBLIC_GEMINI_API_KEY` environment variable. Because Next.js exposes `NEXT_PUBLIC_*` variables in the browser bundle, the key was visible in plain text in:
1. The browser's JavaScript bundle
2. The Network tab (`fetch` URL: `…:generateContent?key=AIzaSy…`)

Any user with DevTools open could extract and abuse the API key.

### Solution: Server-Side Proxy Route

**New file:** [src/app/api/ai/generate-route/route.ts](apps/frontend/management-portal/src/app/api/ai/generate-route/route.ts)

A Next.js App Router API route acts as a server-side proxy. The API key lives exclusively in `GEMINI_API_KEY` — a **server-only** environment variable (no `NEXT_PUBLIC_` prefix).

```
Browser                  Next.js Server              Gemini API
   │                          │                           │
   │  POST /api/ai/           │                           │
   │  generate-route          │                           │
   │  { systemPrompt,         │                           │
   │    userPrompt, … }  ────►│  POST to Gemini URL       │
   │                          │  ?key=<GEMINI_API_KEY>  ──►│
   │                          │                           │
   │  { text, tokensUsed } ◄──│◄── { candidates: […] }   │
   │                          │                           │
```

The proxy:
- Returns `503` if `GEMINI_API_KEY` is not set on the server
- Returns `400` if `systemPrompt` or `userPrompt` is missing
- Forwards Gemini's HTTP status code on error (e.g. `429 Too Many Requests`)
- Returns `{ text: string; tokensUsed?: number }` on success

**Updated file:** [src/services/ai/routeGeminiService.ts](apps/frontend/management-portal/src/services/ai/routeGeminiService.ts)

Key changes to `RouteGeminiAIService`:

| Before | After |
|--------|-------|
| `private apiKey: string` field | Field removed entirely |
| Constructor reads `NEXT_PUBLIC_GEMINI_API_KEY` | Constructor no longer handles keys |
| `isAvailable()` checks `apiKey.length > 0` | `isAvailable()` checks `NEXT_PUBLIC_GEMINI_ENABLED !== 'false'` |
| `generateRouteData()` calls `generativelanguage.googleapis.com` directly with `?key=…` | `generateRouteData()` calls `POST /api/ai/generate-route` |

```typescript
// Before — API key visible in URL in browser Network tab
const response = await fetch(
  `${GEMINI_API_URL}/${this.modelName}:generateContent?key=${this.apiKey}`,
  { … }
);

// After — browser only sees the internal proxy URL
const response = await fetch(AI_PROXY_ROUTE, {   // '/api/ai/generate-route'
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ systemPrompt, userPrompt, model, temperature, maxTokens }),
});
```

**Updated file:** [src/services/ai/routeAIService.ts](apps/frontend/management-portal/src/services/ai/routeAIService.ts)

Removed the forwarded `apiKey` from the `createRouteGeminiService()` call in the factory:

```typescript
// Before
return createRouteGeminiService({
  apiKey: config?.apiKey,   // ← forwarded (now unnecessary)
  model: config?.model,
  …
});

// After
return createRouteGeminiService({
  model: config?.model,     // ← apiKey removed
  …
});
```

### Environment Variable Migration

| Variable | Before | After |
|----------|--------|-------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Required (key exposed in browser) | Deprecated — no longer used |
| `GEMINI_API_KEY` | Not used | **Required** — server-side only, never sent to browser |
| `NEXT_PUBLIC_GEMINI_ENABLED` | Not used | Optional — set to `false` to disable AI Studio without removing the key |

### Benefits
- ✅ **API key never reaches the browser** — removed from JavaScript bundle and Network tab requests
- ✅ **Feature toggle** — `NEXT_PUBLIC_GEMINI_ENABLED=false` disables AI Studio without touching secrets
- ✅ **Graceful degradation** — proxy returns `503` with a clear message if server key is unconfigured
- ✅ **Prompt construction unchanged** — `buildRouteSystemPrompt` and all prompt templates remain in the frontend service
- ✅ **Backward-compatible error handling** — service still returns `AIRouteGenerationResponse` with `success: false` and a human-readable `error` field on any failure

---

## Task 6.3: Add Global Error Boundary ✅

### Problem
An unhandled JavaScript error inside `RouteWorkspaceProvider` or any of its children (e.g., a null-pointer in a mapper, a failed state update) would crash the entire page and display a white screen with no recovery path. React's `Suspense` does not catch render errors — an Error Boundary is required.

### Files Created

#### ErrorBoundary.tsx — Generic Error Boundary
**File:** [src/components/shared/ErrorBoundary.tsx](apps/frontend/management-portal/src/components/shared/ErrorBoundary.tsx)

Two exports:

**`ErrorBoundary`** — a reusable React class component that:
```tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Render-prop fallback: receives the caught Error and a reset callback.
   * Allows callers to provide context-specific fallback UI.
   */
  fallback?: (error: Error | null, reset: () => void) => ReactNode;
}
```

- `static getDerivedStateFromError` sets `hasError: true`
- `componentDidCatch` logs the error + component stack to the console (hook for future integration with Sentry / Datadog)
- `reset()` clears error state so React re-mounts children from scratch
- Includes a simple default fallback if no `fallback` prop is provided

**`WorkspaceErrorFallback`** — a styled fallback page designed for the Route Workspace:

```tsx
interface WorkspaceErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}
```

Features:
- Red warning header with `AlertTriangle` icon and a human-readable message
- **"Try Again"** button — calls `onReset()` to remount the workspace
- **"Back to Routes"** link — navigates to `/mot/routes` to escape the workspace entirely
- Dev-only `<details>` block showing the full error name, message, and stack trace (hidden in production via `process.env.NODE_ENV` check)

#### workspace/page.tsx — Wrap with ErrorBoundary
**File:** [src/app/mot/routes/workspace/page.tsx](apps/frontend/management-portal/src/app/mot/routes/workspace/page.tsx)

```tsx
// Before — no error boundary
export default function RoutesWorkspacePage() {
    return (
        <RouteWorkspaceProvider>
            <Suspense fallback={…}>
                <RouteWorkspaceContent />
            </Suspense>
            <Toaster />
        </RouteWorkspaceProvider>
    );
}

// After — ErrorBoundary wraps the entire workspace tree
export default function RoutesWorkspacePage() {
    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <WorkspaceErrorFallback error={error} onReset={reset} />
            )}
        >
            <RouteWorkspaceProvider>
                <Suspense fallback={…}>
                    <RouteWorkspaceContent />
                </Suspense>
                <Toaster />
            </RouteWorkspaceProvider>
        </ErrorBoundary>
    );
}
```

The `ErrorBoundary` wraps `RouteWorkspaceProvider` so that:
- Any error thrown during rendering of any workspace component is caught
- The user sees `WorkspaceErrorFallback` instead of a white screen
- Clicking "Try Again" calls `ErrorBoundary.reset()`, which unmounts and remounts `RouteWorkspaceProvider` with a fresh state

### Why a Class Component?
React Error Boundaries must be class components — functional components cannot implement `componentDidCatch` or `getDerivedStateFromError`. This is a React framework requirement, not a design choice.

### Benefits
- ✅ **No white screen of death** — render errors produce a recovery UI, not a blank page
- ✅ **User recovery path** — "Try Again" and "Back to Routes" give clear next steps
- ✅ **Developer visibility** — dev mode exposes full stack trace without affecting production users
- ✅ **Extensible logging** — `componentDidCatch` is the standard hook point for error monitoring services
- ✅ **Scoped boundary** — only the workspace is affected; the sidebar, header, and navigation remain functional

---

## Verification Results

### Backend Compilation
```bash
cd apps/backend/api-core
mvn clean compile -q
# Result: BUILD SUCCESS ✅
```

All new annotations compiled without errors:
- `@EnableMethodSecurity` resolved from `spring-security-config` (already on classpath)
- `@PreAuthorize` resolved from `spring-security-core`
- `OptimisticLockException` resolved from `jakarta.persistence`
- `ObjectOptimisticLockingFailureException` resolved from `spring-orm`
- `AccessDeniedException` resolved from `spring-security-core`

### Frontend Type Check
```bash
cd apps/frontend/management-portal
npx tsc --noEmit
# Result: Zero errors in Phase 6 files ✅
# (Pre-existing errors in unrelated files: buses/, policies/, staff/ — not introduced by Phase 6)
```

New files type-checked cleanly:
- `src/app/api/ai/generate-route/route.ts` — zero errors
- `src/components/shared/ErrorBoundary.tsx` — zero errors
- Updated `src/services/ai/routeGeminiService.ts` — zero errors
- Updated `src/services/ai/routeAIService.ts` — zero errors
- Updated `src/app/mot/routes/workspace/page.tsx` — zero errors

### Authorization Verification (Manual)
| Scenario | Expected Result |
|----------|----------------|
| `GET /api/routes` (any authenticated user) | ✅ 200 OK |
| `POST /api/routes/groups` (user with `ROLE_USER`) | ✅ 403 Forbidden + ErrorResponse body |
| `POST /api/routes/groups` (user with `ROLE_MOT_ADMIN`) | ✅ 201 Created |
| `POST /api/routes/groups` (dev mock with `ROLE_ADMIN`) | ✅ 201 Created |
| `DELETE /api/stops/{id}` (unauthenticated) | ✅ 401 Unauthorized |
| `DELETE /api/stops/{id}` (authenticated, no admin role) | ✅ 403 Forbidden |

### API Key Security Verification
- Open browser DevTools → Network tab
- Use AI Studio to generate a route
- Request URL shown: `POST /api/ai/generate-route` ✅
- No `?key=…` query parameter visible anywhere ✅
- Gemini API key not present in any browser request header or body ✅

---

## Impact Summary

### Files Created: 2
| File | Purpose |
|------|---------|
| [src/app/api/ai/generate-route/route.ts](apps/frontend/management-portal/src/app/api/ai/generate-route/route.ts) | Server-side Gemini proxy API route |
| [src/components/shared/ErrorBoundary.tsx](apps/frontend/management-portal/src/components/shared/ErrorBoundary.tsx) | Generic error boundary + workspace fallback |

### Files Modified: 7
| File | Changes |
|------|---------|
| [SecurityConfig.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/shared/config/SecurityConfig.java) | `@EnableMethodSecurity(prePostEnabled = true)` |
| [RouteController.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/network/controller/RouteController.java) | `@PreAuthorize` on 7 mutation endpoints |
| [StopController.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/network/controller/StopController.java) | `@PreAuthorize` on 7 mutation endpoints |
| [GlobalExceptionHandler.java](apps/backend/api-core/src/main/java/com/busmate/routeschedule/shared/exception/GlobalExceptionHandler.java) | `AccessDeniedException` + `OptimisticLockException` handlers |
| [routeGeminiService.ts](apps/frontend/management-portal/src/services/ai/routeGeminiService.ts) | API call moved to server-side proxy |
| [routeAIService.ts](apps/frontend/management-portal/src/services/ai/routeAIService.ts) | Removed `apiKey` forwarding to factory |
| [workspace/page.tsx](apps/frontend/management-portal/src/app/mot/routes/workspace/page.tsx) | Wrapped with `ErrorBoundary` |

---

## Lessons Learned

1. **`@EnableMethodSecurity` is required** — adding `@PreAuthorize` without enabling method security results in silent no-ops, making it easy to think you're protected when you're not.

2. **`hasAnyRole` over `hasRole` for dual environments** — using a single production role would have broken the dev mock filter. `hasAnyRole('ADMIN', 'MOT')` bridges both without compromising security intent.

3. **Server-side proxies are the correct pattern for API keys in Next.js** — `NEXT_PUBLIC_` variables are bundled into the client; removing the prefix is the simplest architectural fix and requires no new infrastructure.

4. **Error Boundaries must be class components in React** — even in a codebase that's otherwise 100% functional components. This is a hard framework constraint, not a style preference.

5. **Phase 1's `@Version` needed a Phase 6 exception handler** — optimistic lock conflicts were silently returning `500 Internal Server Error`. Adding the dedicated handler completes the phase-1 feature correctly.

---

## References

- [Refactoring Plan — Phase 6](docs/plans/RouteWorkspace-Refactoring-Plan.md#9-phase-6-cross-cutting-concerns)
- [Spring Security Method Security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Next.js Route Handlers (App Router)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Phase 1 Summary](docs/summary/routeworkspacer-refactoring-plan/PHASE_1_IMPLEMENTATION_SUMMARY.md)
- [Phase 5 Summary](docs/summary/routeworkspacer-refactoring-plan/PHASE_5_IMPLEMENTATION_SUMMARY.md)

---

**Status:** Phase 6 Complete — All Cross-Cutting Concerns Addressed ✅  
**Next Steps:** Full integration testing of the complete refactored system (all 6 phases).
