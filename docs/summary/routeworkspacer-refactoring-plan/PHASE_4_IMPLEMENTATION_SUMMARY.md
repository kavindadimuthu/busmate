# Phase 4 Implementation Summary - Frontend State Management Refactoring
**Date:** 2026-03-08  
**Status:** ✅ Completed

## Overview
Phase 4 focused on hardening the frontend state management of the RouteWorkspace module. Four discrete tasks were completed: runtime schema validation with Zod, request cancellation on component unmount, submission idempotency, and a race condition fix in stop creation. All changes are backward-compatible and produce zero new TypeScript errors.

---

## Task 4.1: Add Runtime Validation with Zod ✅

### Problem
All API responses were consumed with direct type casts (`as SomeType`). TypeScript types are erased at runtime, so a mismatch between the backend response and the client-side types would cause silent data corruption or cryptic runtime errors rather than a clear diagnostic.

### Files Created
**[src/types/schemas/routeWorkspace.schema.ts](apps/frontend/management-portal/src/types/schemas/routeWorkspace.schema.ts)**

The file is organised into three sections:

#### Section 1 — API Response Schemas
Mirror the OpenAPI-generated models with Zod. All fields are `nullable().optional()` to tolerate the loose types of the generated client.

| Schema | Purpose |
|--------|---------|
| `ApiLocationSchema` | Validates `LocationDto` response |
| `ApiRouteStopResponseSchema` | Validates `RouteStopResponse` |
| `ApiRouteResponseSchema` | Validates `RouteResponse` |
| `ApiRouteGroupResponseSchema` | Validates `RouteGroupResponse` (top-level) |
| `ApiRouteGroupStopDetailSchema` | Validates `RouteGroupStopDetailResponse` |

#### Section 2 — Workspace Data Schemas
Validate the internal workspace data structures when they are parsed from user-supplied YAML or JSON text.

| Schema | Purpose |
|--------|---------|
| `WorkspaceLocationSchema` | Location inside workspace |
| `WorkspaceStopSchema` | Stop inside workspace |
| `WorkspaceRouteStopSchema` | RouteStop inside workspace |
| `WorkspaceRouteSchema` | Route inside workspace |
| `WorkspaceRouteGroupSchema` | RouteGroup inside workspace |
| `WorkspaceDataSchema` | Full workspace data (top-level) |

#### Section 3 — Validation Helpers

```typescript
// Soft-validates the route group API response; logs a warning on mismatch
// but does not throw — avoids crashing the UI for minor server-side changes.
validateRouteGroupApiResponse(data: unknown): ValidationResult<ApiRouteGroupResponse>

// Soft-validates the stop-details API response
validateStopDetailsApiResponse(data: unknown): ValidationResult<ApiRouteGroupStopDetail[]>

// Hard-validates workspace data parsed from YAML/JSON; returns a structured
// error message suitable for display to the user.
validateWorkspaceData(data: unknown): ValidationResult<WorkspaceDataValidated>
```

### Usage in Provider
**File:** [RouteWorkspaceProvider.tsx](apps/frontend/management-portal/src/context/RouteWorkspace/RouteWorkspaceProvider.tsx)

```typescript
import {
  validateRouteGroupApiResponse,
  validateStopDetailsApiResponse,
} from '@/types/schemas/routeWorkspace.schema';

// Inside loadRouteGroup():
const routeGroupValidation = validateRouteGroupApiResponse(routeGroupResponseRaw);
if (!routeGroupValidation.success) {
  console.warn('[loadRouteGroup] Route group response validation warning:', routeGroupValidation.error);
}

const stopDetailsValidation = validateStopDetailsApiResponse(allStopDetailsRaw);
if (!stopDetailsValidation.success) {
  console.warn('[loadRouteGroup] Stop details response validation warning:', stopDetailsValidation.error);
}
```

### Why Soft Validation?
The generated OpenAPI client already provides TypeScript types at compile time. Adding a hard `parse()` that throws would break the UI every time the server adds a new optional field. Using `safeParse()` with a warning gives the team a clear console signal when types drift, without degrading the user experience.

### Benefits
- ✅ **Runtime type safety** — catches response shape mismatches not visible at compile time
- ✅ **Better debugging** — structured Zod validation errors instead of silent `undefined` access
- ✅ **Workspace data integrity** — YAML/JSON from Textual Mode is validated before applying to state
- ✅ **No breaking change** — soft validation (warn, not throw) for API responses

---

## Task 4.2: Fix Request Cancellation on Unmount ✅

### Problem
`loadRouteGroup` fired two async API calls (`getRouteGroupById` and `getStopsByRouteGroup`). If the user opened the workspace page and then immediately navigated away, both calls would complete after the component unmounted and attempt to call `setData`, `setMode`, `setIsLoading`, and `setRouteGroupId` on an unmounted component — causing React's "Can't perform a state update on an unmounted component" warning and a potential memory leak.

### Solution
**File:** [RouteWorkspaceProvider.tsx](apps/frontend/management-portal/src/context/RouteWorkspace/RouteWorkspaceProvider.tsx)

Two mechanisms work together:

#### 1. Mounted Ref
```typescript
const mountedRef = useRef(true);
useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    // Note: We do NOT cancel in-flight requests here because React StrictMode
    // (enabled in Next.js dev mode) intentionally unmounts/remounts components,
    // which would abort legitimate requests. The mountedRef guards are sufficient.
  };
}, []);
```
The cleanup function fires when the `RouteWorkspaceProvider` unmounts, setting `mountedRef.current = false` to prevent any pending `setState` calls from affecting the now-dead component tree.

**Important:** We intentionally **do not** cancel CancelablePromises in the cleanup because React's StrictMode (enabled by default in Next.js development) intentionally unmounts and re-mounts components to detect bugs. Canceling promises during StrictMode's test unmount would abort legitimate user-initiated requests, causing "Request aborted" errors when navigating to the edit page.

#### 2. Pending Requests Ref + CancelablePromise Cancellation
```typescript
const pendingRequestsRef = useRef<{ cancel: () => void }[]>([]);

// Inside loadRouteGroup():
// Cancel any in-flight requests before starting a new load
pendingRequestsRef.current.forEach(p => { try { p.cancel(); } catch { /* noop */ } });
pendingRequestsRef.current = [];

const routeGroupPromise = RouteManagementService.getRouteGroupById(id);
pendingRequestsRef.current.push(routeGroupPromise); // CancelablePromise has .cancel()
const routeGroupResponseRaw = await routeGroupPromise;

if (!mountedRef.current) return false; // ← Guard before every setState
```

Guards are placed at every async suspension point inside `loadRouteGroup`:
1. Before the first await (after scheduling)
2. After `getRouteGroupById` resolves
3. After `getStopsByRouteGroup` resolves
4. Before `setData` / `setRouteGroupId` / `setMode` / `setIsLoading`

#### In-flight deduplication bonus
If the caller invokes `loadRouteGroup` again before the previous call completes (e.g., rapid navigation), the new call cancels the old CancelablePromises before starting fresh. This prevents two concurrent loads from racing to update the same state.

### Benefits
- ✅ **No memory leaks** — API responses are dropped when the component unmounts
- ✅ **No React unmount warnings** — `mountedRef` guards every `setState` call
- ✅ **In-flight deduplication** — rapid repeated calls cancel the previous in-flight request
- ✅ **CancelablePromise integration** — leverages the generated API client's built-in cancellation

---

## Task 4.3: Add Submission Idempotency ✅

### Problem
Double-clicking "Proceed" / "Update" in `RouteSubmissionModal` could launch two concurrent submission flows. Both would attempt to validate stops, create new stops, and then call `createRouteGroup` or `updateRouteGroup` — resulting in duplicate stops and/or duplicate route groups in the database.

### Solution
**File:** [RouteSubmissionModal.tsx](apps/frontend/management-portal/src/components/mot/routes/workspace/RouteSubmissionModal.tsx)

```typescript
// State for disabling the UI
const [isSubmitting, setIsSubmitting] = useState(false);

// Ref-based token to detect stale async callbacks
const submissionIdRef = useRef<string | null>(null);
```

#### Guarded `handleProceed`
```typescript
const handleProceed = useCallback(async () => {
  // Reject concurrent invocations immediately
  if (isSubmitting) {
    console.warn('[RouteSubmissionModal] Submission already in progress — ignoring duplicate call.');
    return;
  }

  // Stamp this attempt with a unique ID
  const submissionId = crypto.randomUUID();
  submissionIdRef.current = submissionId;
  setIsSubmitting(true);

  try {
    // ... validation, stop creation, route group submission
  } finally {
    // Only the currently active attempt may clear the flag
    if (submissionIdRef.current === submissionId) {
      setIsSubmitting(false);
      submissionIdRef.current = null;
    }
  }
}, [isSubmitting, validateStops, createNewStops, buildRouteGroup]);
```

Why both a boolean state **and** a UUID ref?
- The `isSubmitting` boolean controls the UI (button disabled, spinner shown).
- The UUID ref guards against a theoretical edge case where a stale async callback from request A survives long enough to reach the `finally` block after request B has already started — ensuring B's `isSubmitting` flag is not cleared prematurely.

#### Button with Loading Indicator
```tsx
<Button
  onClick={handleProceed}
  disabled={validRoutes.length === 0 || isSubmitting}   // ← disabled while running
>
  {isSubmitting ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {mode === 'edit' ? 'Updating...' : 'Processing...'}
    </>
  ) : (
    <>
      <ArrowRight className="w-4 h-4 mr-2" />
      {mode === 'edit' ? 'Update' : 'Proceed'}
    </>
  )}
</Button>
```

The "Cancel" button is also disabled while submitting to prevent the user from closing the modal mid-flight.

#### State Reset on Close
```typescript
useEffect(() => {
  if (!isOpen) {
    setState(initialState);
    setProgress({ current: 0, total: 0, label: '' });
    setIsSubmitting(false);       // ← added
    submissionIdRef.current = null; // ← added
  }
}, [isOpen]);
```

### Verification
- Click "Proceed" rapidly multiple times → only one submission executes; button disabled after first click
- Spinner visible during the entire submission flow
- Button re-enables only after the flow completes (success or failure)

### Benefits
- ✅ **No duplicate submissions** — first-click wins; subsequent clicks during processing are no-ops
- ✅ **No duplicate stops or route groups** — database integrity preserved
- ✅ **Visual feedback** — spinner and disabled state make it clear a submission is running
- ✅ **Stale-callback safe** — UUID ref prevents a zombie async callback from clearing active state

---

## Task 4.4: Fix Race Condition in Stop Creation ✅

### Problem
After batch-creating new stops, `createNewStops` updated the context with a deeply nested loop:

```typescript
// ❌ Before — O(createdStops × routes × routeStops) setState calls
for (const { original, created } of createdStops) {
  data.routeGroup.routes.forEach((route, routeIndex) => {
    route.routeStops.forEach((routeStop, stopIndex) => {
      if (routeStop.stop.name === original.name &&
          routeStop.stop.type === StopExistenceType.NEW) {
        updateRoute(routeIndex, {
          routeStops: route.routeStops.map((rs, idx) =>
            idx === stopIndex ? { ...rs, stop: created } : rs
          )
        });
      }
    });
  });
}
```

**Issues:**
1. **Multiple `updateRoute` calls per route** — if route 0 had two new stops, `updateRoute(0, ...)` was called twice. The second call overwrote the first because `route.routeStops` was from the stale closure snapshot. One stop update was lost.
2. **O(N×M×K) state updates** — N created stops × M routes × K route stops, each triggering a React re-render, causing visible UI flicker.
3. **Stale closure** — `data.routeGroup.routes` captured at render time; intermediate React state snapshots were never used.

### Solution
**File:** [RouteSubmissionModal.tsx](apps/frontend/management-portal/src/components/mot/routes/workspace/RouteSubmissionModal.tsx)

```typescript
// ✅ After — O(routes) setState calls, one per route at most

// Build a name→createdStop lookup for O(1) access during the single pass
const createdStopByName = new Map<string, Stop>(
  createdStops.map(({ original, created }) => [original.name, created])
);

// Single pass over routes — one updateRoute call per route that changed
data.routeGroup.routes.forEach((route, routeIndex) => {
  const updatedRouteStops = route.routeStops.map(routeStop => {
    if (routeStop.stop.type === StopExistenceType.NEW && routeStop.stop.name) {
      const created = createdStopByName.get(routeStop.stop.name);
      if (created) {
        return { ...routeStop, stop: { ...created } };
      }
    }
    return routeStop;
  });

  // Skip routes where nothing changed — avoid unnecessary re-renders
  const hasChanges = updatedRouteStops.some((rs, idx) => rs !== route.routeStops[idx]);
  if (hasChanges) {
    updateRoute(routeIndex, { routeStops: updatedRouteStops });
  }
});
```

**Why this works:**
- All swaps for a given route are computed in a single `map()` traversal before any `setState` is called.
- `updateRoute(routeIndex, ...)` is called at most once per route, so there is no possibility of a later call overwriting an earlier one with stale data.
- Routes with no new stops are skipped entirely, avoiding wasted re-renders.

### Before vs After

| Metric | Before | After |
|--------|--------|-------|
| `updateRoute` calls (5 created stops, 2 routes, 10 stops each) | Up to 10 | At most 2 |
| Risk of stop update being overwritten | High (stale closure) | None |
| Re-renders per `createNewStops` call | Up to 10 | At most 2 |
| Time complexity | O(N×M×K) | O(N + M×K) |

### Verification
- Create a route group with 2 routes, each containing 5 new stops
- All 10 stops receive correct IDs after batch creation
- No stop update is silently overwritten

### Benefits
- ✅ **Correct stop ID assignment** — all new stops receive their server-assigned IDs
- ✅ **No stale overwrites** — single-pass, single state update per route
- ✅ **Fewer re-renders** — maximally reduces unnecessary React reconciliation cycles
- ✅ **Better performance** — O(N + M×K) vs O(N×M×K) complexity

---

## TypeScript Verification

```bash
cd apps/frontend/management-portal
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E \
  "(routeWorkspace\.schema|RouteWorkspaceProvider|RouteSubmissionModal)"

# Output:
# ✅ No errors in Phase 4 files
```

All pre-existing errors in unrelated files (`BusStatsCards.tsx`, `BusTabsSection.tsx`, `StaffStatsCards.tsx`, etc.) are untouched by Phase 4.

---

## Impact Summary

### Files Created: 1

| File | Purpose |
|------|---------|
| `src/types/schemas/routeWorkspace.schema.ts` | Zod schemas for API response validation and workspace data integrity |

### Files Modified: 2

| File | Changes |
|------|---------|
| `src/context/RouteWorkspace/RouteWorkspaceProvider.tsx` | + `mountedRef`, `pendingRequestsRef`, `loadingRouteGroupIdRef` (StrictMode fix), `useEffect` cleanup, Zod validation in `loadRouteGroup`, `mountedRef` guards before every `setState`, route-ID-aware cancellation |
| `src/components/mot/routes/workspace/RouteSubmissionModal.tsx` | + `useRef` import, `isSubmitting` state, `submissionIdRef`, idempotency guard in `handleProceed`, spinner in submit button, reset on close, batch context update in `createNewStops` |

### Lines of Code

| Component | Before | After | Change |
|-----------|--------|-------|--------|
| `routeWorkspace.schema.ts` | 0 | ~230 | +230 (new file) |
| `RouteWorkspaceProvider.tsx` | 533 | 602 | +69 (guards + validation + StrictMode fix) |
| `RouteSubmissionModal.tsx` | 1,041 | ~1,080 | +39 (idempotency + batch fix) |

---

## Issues Resolved

| Issue | Priority | Status |
|-------|----------|--------|
| No runtime validation of API responses | Critical | ✅ Fixed — Zod soft-validation with warning |
| Memory leak on component unmount | High | ✅ Fixed — `mountedRef` guards |
| Double-submission creates duplicate data | Critical | ✅ Fixed — `isSubmitting` + UUID ref guard |
| Stale-closure overwrites in stop update loop | Critical | ✅ Fixed — single-pass batch update, one `updateRoute` per route |
| Edit button navigation fails in dev mode (StrictMode) | Critical | ✅ Fixed — Route-ID-aware cancellation |

---

## Post-Implementation Bug Fix: React StrictMode Interaction

### Issue Discovered
After Phase 4 implementation, clicking the Edit button in development mode resulted in:
```
CancelError: Request aborted
Failed to load route group
```

However, the **production build worked perfectly**, indicating an environment-specific issue.

### Root Cause Analysis
The issue was caused by React StrictMode's intentional **mount → unmount → remount cycle** in development:

**Flow with StrictMode:**
1. **First mount**: User navigates to edit page → `loadRouteGroup(id)` called → promise added to `pendingRequestsRef`
2. **StrictMode unmounts**: Component cleanup runs → `mountedRef.current = false`
3. **StrictMode re-mounts**: `mountedRef.current = true` → page's `useEffect` calls `loadRouteGroup(id)` **again**
4. **Cancellation at wrong time**: At the start of the second call, this code ran:
   ```typescript
   pendingRequestsRef.current.forEach(p => p.cancel());
   ```
   This canceled the **legitimate request from the first mount** 🐛

### Solution: Route-ID-Aware Cancellation
Only cancel previous requests if loading a **different** route group:

```typescript
// Track the currently loading route group ID
const loadingRouteGroupIdRef = useRef<string | null>(null);

const loadRouteGroup = async (id: string): Promise<boolean> => {
  // Only cancel if switching to a different route group
  if (loadingRouteGroupIdRef.current !== id) {
    pendingRequestsRef.current.forEach(p => { try { p.cancel(); } catch {} });
    pendingRequestsRef.current = [];
  }
  
  loadingRouteGroupIdRef.current = id;
  
  try {
    // ... API calls ...
  } finally {
    pendingRequestsRef.current = [];
    loadingRouteGroupIdRef.current = null; // Reset after completion
  }
};
```

### Why This Works
- **Same route group (StrictMode remount)**: Second `loadRouteGroup(id)` call **skips cancellation** because `loadingRouteGroupIdRef.current === id`
- **Different route group (navigation)**: Properly cancels previous request because `loadingRouteGroupIdRef.current !== id`
- **Production mode**: No StrictMode double-mounting, works as expected
- **Development mode**: Now also works correctly despite StrictMode's intentional remount

### Verification
✅ Development mode: Edit button navigation works without "Request aborted" error  
✅ Production mode: Continues to work as before  
✅ TypeScript compilation: No new errors  
✅ Navigation between different route groups: Properly cancels previous requests  

---

## Next Steps (Phase 5)

Phase 5 will focus on **Frontend Component Architecture**:

1. **Task 5.1** — Memoize `RouteStopsList` row components with `React.memo` + `useCallback` to stop full re-renders on every keystroke
2. **Task 5.2** — Replace remaining `alert()` calls with `toast` notifications for a consistent UX
3. **Task 5.3** — Full keyboard navigation for drag-and-drop (already partially in place via `@dnd-kit` `KeyboardSensor`)
4. **Task 5.4** — Fix map action listener memory leak in `RouteStopsMap.tsx`

---

## References
- [Phase 1 Implementation Summary](PHASE_1_IMPLEMENTATION_SUMMARY.md)
- [Phase 2 Implementation Summary](PHASE_2_IMPLEMENTATION_SUMMARY.md)
- [Phase 3 Implementation Summary](PHASE_3_IMPLEMENTATION_SUMMARY.md)
- [Refactoring Plan](../../plans/RouteWorkspace-Refactoring-Plan.md)
- [Zod Documentation](https://zod.dev)
- [React useRef — avoiding stale closures](https://react.dev/reference/react/useRef)
- [CancelablePromise pattern](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

**Status:** Phase 4 Complete — Ready for Phase 5 (Frontend Component Architecture) ✅
