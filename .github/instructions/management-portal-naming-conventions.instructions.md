---
description: "Use when creating, modifying, or reviewing any file in the BusMate Management Portal (apps/frontend/management-portal). Covers all naming conventions: files, folders, components, hooks, services, context/providers, types, constants, API routes, utilities, validation rules, data files, and directory structure."
applyTo: "apps/frontend/management-portal/**"
---

# BusMate Management Portal — Naming Conventions

These rules apply to every file under `apps/frontend/management-portal/`. Follow them strictly when generating, modifying, or suggesting code in the management portal.

---

## 1. Core Case Rules (Quick Reference)

| Artifact | Convention | Example |
|----------|------------|---------|
| React component (file) | `PascalCase.tsx` | `BusActionButtons.tsx` |
| ShadCN UI primitive (file) | `kebab-case.tsx` | `dropdown-menu.tsx` |
| Layout wrapper (file) | `kebab-case.tsx` | `mot-layout-client.tsx` |
| Hook (file) | `camelCase.ts` | `useDashboard.ts` |
| Domain service (`/src/services/`) | `camelCase.ts` | `routeAutoGeneration.ts` |
| Lib service class (`/src/lib/services/`) | `PascalCase.ts` | `DashboardService.ts` |
| Utility | `camelCase.ts` | `formatTime.ts` |
| Config file | `camelCase.ts` | `navigation.ts` |
| Data file | `camelCase.ts` | `analytics.ts` |
| Type / Interface (file) | `PascalCase.ts` | `RouteWorkspaceData.ts` |
| Context file | `PascalCase.ts / .tsx` | `RouteWorkspaceContext.ts` |
| Validation rules | `camelCase.ts` | `scheduleValidation.ts` |
| Constants (identifiers) | `SCREAMING_SNAKE_CASE` | `MAX_ROUTES` |
| App Router route folder | `kebab-case` | `/bus-stops/`, `/staff-management/` |
| Context folder | `PascalCase` | `RouteWorkspace/` |
| Component sub-folder | `kebab-case` | `buses/`, `fleet-management/` |
| API route folder | `kebab-case` | `/api/auth/`, `/api/ai/` |

---

## 2. Next.js App Router (`src/app/`)

### 2.1 Route folders
All route-generating folders MUST be `kebab-case` (lowercase, hyphenated). This keeps URLs readable and SEO-friendly.

```
src/app/
  mot/
    bus-stops/
      page.tsx
    fleet-management/
      page.tsx
    passenger-service-permits/
      page.tsx
    staff-management/
      page.tsx
    location-tracking/
      page.tsx
  operator/
    revenue-analytics/
      page.tsx
    salary-management/
      page.tsx
  timekeeper/
    trips/
      page.tsx
```

✅ `bus-stops/`, `staff-management/`, `revenue-analytics/`
❌ `BusStops/`, `staffManagement/`, `RevenueAnalytics/`

### 2.2 Special Next.js files
Always `camelCase` or lowercase as required by Next.js:

```
page.tsx        ✅
layout.tsx      ✅
loading.tsx     ✅
error.tsx       ✅
not-found.tsx   ✅
```

### 2.3 API routes (`src/app/api/`)
Follow `kebab-case` folder names. The route handler file is always `route.ts`.

```
src/app/api/
  auth/
    route.ts
  ai/
    route.ts
```

### 2.4 Dynamic segments
Use `camelCase` inside brackets:

```
[routeGroupId]/   ✅
[route-group-id]/ ❌
[RouteGroupId]/   ❌
```

---

## 3. Components (`src/components/`)

### 3.1 Role-based directory structure
Components are organised by portal role, then by domain feature within that role:

```
src/components/
  admin/           ← System admin components
    dashboard/
    logs/
    monitoring/
    notifications/
    profile/
    settings/
    users/
  mot/             ← Ministry of Transport admin components
    analytics/
    buses/
    bus-stops/
    dashboard/
    fares/
    location-tracking/
    notifications/
    operators/
    passenger-service-permits/
    permits/
    policies/
    profile/
    routes/
    schedule-details/
    schedules/
    staff/
    trip-assignment/
    trip-details/
    trips/
    users/
  operator/        ← Bus operator components
    dashboard/
    fleet/
    permits/
    profile/
    revenue/
    revenue-analytics/
    salary-mgmt/
    staff/
    trips/
  timekeeper/      ← Timekeeper components
    attendance/
    dashboard/
    profile/
    trips/
  shared/          ← Role-agnostic reusable components
  layouts/         ← Layout wrapper components
  ui/              ← ShadCN primitive components ONLY
  tools/           ← Developer / debugging tools
```

Role directory names (`admin`, `mot`, `operator`, `timekeeper`) and sub-domain directories use `kebab-case`.

### 3.2 Application component files — `PascalCase`
All React components that represent domain-level UI MUST use `PascalCase` file names.

```
BusActionButtons.tsx        ✅
RouteAdvancedFilters.tsx     ✅
TripStatsCards.tsx           ✅
DeleteRouteConfirmation.tsx  ✅
StatsCard.tsx                ✅
DataTable.tsx                ✅
SearchFilterBar.tsx          ✅
RouteSubmissionModal.tsx     ✅

bus-action-buttons.tsx       ❌
routeAdvancedFilters.tsx     ❌
```

### 3.3 ShadCN UI primitive files — `kebab-case` (under `src/components/ui/`)
Files under `src/components/ui/` follow ShadCN conventions and MUST use `kebab-case`.

```
src/components/ui/
  button.tsx
  badge.tsx
  card.tsx
  dialog.tsx
  dropdown-menu.tsx
  scroll-area.tsx
  radio-group.tsx
```

✅ `dropdown-menu.tsx`, `scroll-area.tsx`
❌ `DropdownMenu.tsx`, `ScrollArea.tsx`

Imports remain PascalCase regardless:
```tsx
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
```

### 3.4 Layout wrapper files — `kebab-case` (under `src/components/layouts/`)
Layout wrapper files that are client-side or role-specific use `kebab-case`.

```
src/components/layouts/
  mot-layout-client.tsx
  mot-sidebar-user.tsx
  portal-sidebar-user.tsx
  role-layout-client.tsx
```

### 3.5 Shared component naming patterns
Components in `src/components/shared/` use `PascalCase`:

```
ActionButton.tsx
DataPagination.tsx
DataTable.tsx
ErrorBoundary.tsx
SearchFilterBar.tsx
StatsCard.tsx
StatsCardsContainer.tsx
SwitchableTabs.tsx
```

---

## 4. React Component Identifiers

### 4.1 Component function / export name — `PascalCase`
Always matches the file name exactly.

```tsx
// File: BusActionButtons.tsx
export function BusActionButtons() { ... }

// File: RouteMap.tsx
export function RouteMap() { ... }
```

### 4.2 Props interface — `{Component}Props`
```tsx
interface BusActionButtonsProps {
  busId: string;
  onDelete: () => void;
}

interface RouteMapProps {
  routeId: string;
  isReadOnly?: boolean;
}
```

Extend `React.ComponentProps<"element">` or named HTML element types where applicable:
```tsx
interface InputProps extends React.ComponentProps<"input"> {
  label: string;
}
```

---

## 5. Hooks (`src/hooks/`)

### 5.1 File naming — `camelCase` with `use` prefix
```
useDashboard.ts         ✅
useDriverStatus.ts      ✅
useLocationTracking.ts  ✅
useMOTDashboard.ts      ✅
useOperatorDashboard.ts ✅
useRouteValidation.ts   ✅
useSystemMonitoring.ts  ✅
useTimeStopGraph.ts     ✅
useGoogleMaps.ts        ✅

use-dashboard.ts        ❌
UseDashboard.ts         ❌
```

**Exception:** ShadCN-origin utility hooks copied into `src/hooks/` retain their `kebab-case` filenames (`use-mobile.tsx`, `use-toast.ts`). Do not rename these.

### 5.2 Hook function name — exactly matches file name
```ts
// File: useRouteValidation.ts
export function useRouteValidation(data: RouteWorkspaceData) { ... }
```

### 5.3 Return type naming
Name the return type `Use{Feature}Return` when explicitly typed:
```ts
interface UseRouteValidationReturn {
  canSubmit: boolean;
  issues: ValidationIssue[];
}
```

---

## 6. Context & Providers (`src/context/`)

### 6.1 Folder naming — `PascalCase`
Each context lives in its own `PascalCase` folder:
```
src/context/
  RouteWorkspace/
  ScheduleWorkspace/
  PageContext/
```

### 6.2 File naming inside context folders
| File | Convention | Example |
|------|------------|---------|
| Context object | `{Name}Context.ts` | `RouteWorkspaceContext.ts` |
| Provider component | `{Name}Provider.tsx` | `RouteWorkspaceProvider.tsx` |
| Consumer hook | `use{Name}.ts` | `useRouteWorkspace.ts` |

### 6.3 Context type naming — `{Name}ContextType`
```ts
// RouteWorkspaceContext.ts
export interface RouteWorkspaceContextType {
  mode: WorkspaceMode;
  data: RouteWorkspaceData;
  // ...
}

export const RouteWorkspaceContext = createContext<RouteWorkspaceContextType | null>(null);
```

### 6.4 Provider component naming — `{Name}Provider`
```tsx
// RouteWorkspaceProvider.tsx
export function RouteWorkspaceProvider({ children }: { children: React.ReactNode }) { ... }
```

---

## 7. Services

The management portal has two service layers with different naming conventions.

### 7.1 Domain services (`src/services/`) — `camelCase` file names
Pure domain-logic helpers and serializers. File names use `camelCase`.

```
src/services/
  routeAutoGeneration.ts    ✅
  routeWorkspaceMap.ts      ✅
  routeWorkspaceSerializer.ts ✅
  routeWorkspaceValidation.ts ✅
  scheduleWorkspaceSerializer.ts ✅
  timeStopGraph.ts          ✅
```

Functions and exports inside are also `camelCase`:
```ts
export function serializeRouteWorkspace(data: RouteWorkspaceData): string { ... }
export async function generateRouteFromAI(options: AutoGenerationOptions) { ... }
```

### 7.2 API service classes (`src/lib/services/`) — `PascalCase` file names
Class-based services that wrap external API calls. File names use `PascalCase` matching the class name.

```
src/lib/services/
  DashboardService.ts       ✅
  notificationService.ts    ⚠️  (legacy — prefer PascalCase for new files)
  revenueService.ts         ⚠️  (legacy — prefer PascalCase for new files)
  staff-management-service.ts ⚠️  (legacy — prefer PascalCase for new files)
```

**Rule for new lib service files:** Use `PascalCase`:
```ts
// File: PermitManagementService.ts
export class PermitManagementService { ... }
```

---

## 8. Types & Interfaces (`src/types/`)

### 8.1 Type files — `PascalCase` 
```
src/types/
  IdTokenPayload.ts       ✅
  RouteWorkspaceData.ts   ✅
  ScheduleWorkspaceData.ts ✅
  UserData.ts             ✅
  location-tracking.ts    ⚠️  (legacy — prefer PascalCase for new files)
```

**Rule for new type files:** Use `PascalCase` matching the primary exported type.

### 8.2 Schema files (`src/types/schemas/`) — `camelCase` with `.schema.ts` suffix
```
routeWorkspace.schema.ts  ✅
```

### 8.3 Type and Interface identifiers — `PascalCase`
```ts
export interface RouteWorkspaceData { ... }
export type WorkspaceMode = 'create' | 'edit';
export type ValidationSeverity = 'error' | 'warning' | 'info';
export interface ValidationIssue { ... }
```

### 8.4 Suffix conventions for common patterns
| Pattern | Suffix | Example |
|---------|--------|---------|
| Context shape | `ContextType` | `RouteWorkspaceContextType` |
| Service response | `Response` | `DashboardMetricsResponse` |
| API payload | `Payload` | `IdTokenPayload` |
| Form data | `FormData` | `BusFormData` |
| Filter state | `Filters` | `RouteFilters` |
| Summary / aggregate | `Summary` | `RouteValidationSummary` |

---

## 9. Utilities (`src/lib/utils/`)

File names use `camelCase`:
```
src/lib/utils/
  getDecodedAccessToken.ts  ✅
  getRoleRedirectPath.ts    ✅
  getUserData.ts            ✅
  signOut.ts                ✅
  formatTime.ts             ✅
  fetcher.ts                ✅
```

Functions inside also use `camelCase`:
```ts
export function getDecodedAccessToken(token: string): IdTokenPayload { ... }
export function getRoleRedirectPath(role: string): string { ... }
```

---

## 10. Constants (`src/lib/constants.ts`)

All constant identifiers use `SCREAMING_SNAKE_CASE`:
```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL || 'http://localhost:8080';
export const STAFF_API_BASE = process.env.NEXT_PUBLIC_STAFF_API_BASE || '/api/user-management';
export const MAX_ROUTES = 50;
export const SESSION_DURATION_MINUTES = 30;
```

Group related constants in named const objects (PascalCase object name):
```ts
export const RouteStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
} as const;
```

---

## 11. Data Files (`src/data/`)

Data files organised by role, using `camelCase` file names:
```
src/data/
  admin/
    dashboard.ts
    users.ts
  mot/
    analytics.ts      ✅
    dashboard.ts      ✅
    fares.ts          ✅
    policies.ts       ✅
    staff.ts          ✅
  operator/
    ...
  timekeeper/
    ...
```

---

## 12. Config Files (`src/config/`)

File names use `camelCase`:
```
src/config/
  navigation.ts    ✅
```

Exported config objects use `camelCase` for collections, `PascalCase` for typed config shapes:
```ts
// navigation.ts
export const motNavigation: NavigationConfig = { ... };
export const operatorNavigation: NavigationConfig = { ... };
```

---

## 13. Validation Rules (`src/validation-rules/`)

File names use `camelCase`:
```
src/validation-rules/
  scheduleValidation.ts  ✅
  types.ts
  index.ts
```

---

## 14. Path Aliases

Always use the `@/` alias for `src/` imports. Never use relative paths that traverse upward more than one directory.

```ts
import { Button } from "@/components/ui/button";           ✅
import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace"; ✅
import { STAFF_API_BASE } from "@/lib/constants";          ✅
import { RouteWorkspaceData } from "@/types/RouteWorkspaceData"; ✅

import { Button } from "../../../components/ui/button";    ❌
```

### 14.1 External package aliases
| Package alias | Purpose |
|---------------|---------|
| `@busmate/api-client-route` | Route management API client |
| `@busmate/api-client-ticketing` | Ticketing management API client |
| `@busmate/ui` | Shared UI component library |

---

## 15. Environment Variables

Use `NEXT_PUBLIC_` prefix for browser-accessible variables. Reference via `process.env`:

```ts
process.env.NEXT_PUBLIC_USER_MANAGEMENT_API_URL
process.env.NEXT_PUBLIC_STAFF_API_BASE
process.env.NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL
```

Identifier constants wrapping env vars use `SCREAMING_SNAKE_CASE` (see §10).

---

## 16. Proxy (`src/proxy.ts`)

The top-level `proxy.ts` file is a singleton; always `camelCase`, never renamed.

---

## 17. Role-Based Portal Structure

The management portal serves four distinct roles. Component and page files belong to their corresponding role directory:

| Role | Route prefix | Component dir | Data dir |
|------|-------------|---------------|----------|
| System Admin | `/admin` | `components/admin/` | `data/admin/` |
| MOT Admin | `/mot` | `components/mot/` | `data/mot/` |
| Bus Operator | `/operator` | `components/operator/` | `data/operator/` |
| Timekeeper | `/timekeeper` | `components/timekeeper/` | `data/timekeeper/` |

Cross-role components live in `components/shared/`. Use shared components when a UI pattern is used by two or more roles.

---

## 18. Copilot Enforcement Summary

When generating or suggesting code in `apps/frontend/management-portal/**`, Copilot MUST:

1. Use `PascalCase` for all React component files (except ShadCN `ui/` and `layouts/` which use `kebab-case`).
2. Use `camelCase` with `use` prefix for all custom hook files.
3. Use `camelCase` for domain service files under `src/services/`.
4. Use `PascalCase` for new API service class files under `src/lib/services/`.
5. Use `PascalCase` for type/interface files under `src/types/`.
6. Use `camelCase` for utility, config, data, and validation-rules files.
7. Use `SCREAMING_SNAKE_CASE` for all constant identifiers.
8. Use `kebab-case` for all App Router route folders and API route folders.
9. Use `PascalCase` for context folders and their Context/Provider/hook files.
10. Use `@/` path alias for all intra-portal imports.
11. Place components in the correct role directory (`admin/`, `mot/`, `operator/`, `timekeeper/`, `shared/`) based on the consuming role(s).
12. Name component props interfaces as `{Component}Props`.
13. Name context types as `{Name}ContextType` and providers as `{Name}Provider`.
