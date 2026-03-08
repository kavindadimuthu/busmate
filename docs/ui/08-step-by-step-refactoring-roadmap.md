# 08 — Step-by-Step Refactoring Roadmap

> **Scope**: A detailed, sequential refactoring plan — each step small enough for an AI coding agent to execute safely.
> **Goal**: Transform BusMate's management portal UI from its current state to the modern, token-based shadcn/ui design system defined in this document series.

---

## Table of Contents

1. [Roadmap Overview](#1-roadmap-overview)
2. [Phase 1 — Foundation](#2-phase-1--foundation)
3. [Phase 2 — Design System Core](#3-phase-2--design-system-core)
4. [Phase 3 — Pattern Library](#4-phase-3--pattern-library)
5. [Phase 4 — Layout Migration](#5-phase-4--layout-migration)
6. [Phase 5 — Feature Module Migration](#6-phase-5--feature-module-migration)
7. [Phase 6 — Polish & Cleanup](#7-phase-6--polish--cleanup)
8. [Execution Rules for AI Agents](#8-execution-rules-for-ai-agents)

---

## 1. Roadmap Overview

### Phase Diagram

```
Phase 1: Foundation          (Steps 1-5)     ~1 day
Phase 2: Design System Core  (Steps 6-12)    ~2 days
Phase 3: Pattern Library     (Steps 13-20)   ~2 days
Phase 4: Layout Migration    (Steps 21-26)   ~2 days
Phase 5: Feature Migration   (Steps 27-40)   ~5 days
Phase 6: Polish & Cleanup    (Steps 41-46)   ~2 days
                                              --------
                                              ~14 days
```

### Critical Principles

1. **The app must compile and run after every step** — no broken intermediate states.
2. **Strangler fig pattern** — new code wraps old code; old code is removed only after the new code is verified.
3. **One concern per step** — each step changes one thing.
4. **Test after each step** — verify the app still works.

---

## 2. Phase 1 — Foundation

### Step 1: Initialize shared UI library

**Objective**: Create `libs/ui/` as the shared component library.

**Tasks**:
1. Create directory `libs/ui/`
2. Create `libs/ui/package.json`:
   ```json
   {
     "name": "@busmate/ui",
     "version": "0.1.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts",
       "./styles": "./src/styles/globals.css"
     },
     "peerDependencies": {
       "react": "^19.0.0",
       "react-dom": "^19.0.0"
     }
   }
   ```
3. Create `libs/ui/tsconfig.json` extending workspace base
4. Create `libs/ui/project.json` for Nx
5. Create `libs/ui/src/index.ts` (empty barrel export)
6. Create `libs/ui/src/lib/utils.ts` with `cn()` helper

**Files created**: 6 new files
**Files modified**: 0
**Verification**: `pnpm install` succeeds, `tsc --noEmit` passes

---

### Step 2: Set up shadcn/ui CLI

**Objective**: Configure official shadcn CLI for the shared library.

**Tasks**:
1. Create `libs/ui/components.json`:
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": true,
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/styles/globals.css",
       "baseColor": "zinc",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "@busmate/ui/components",
       "utils": "@busmate/ui/lib/utils",
       "hooks": "@busmate/ui/hooks",
       "lib": "@busmate/ui/lib"
     }
   }
   ```
2. Verify CLI works: `pnpm dlx shadcn@latest add button --cwd libs/ui --path src/components`
3. Delete test output if it was just for verification

**Files created**: 1 (`components.json`)
**Verification**: shadcn CLI generates component without error

---

### Step 3: Create design token CSS file

**Objective**: Define all CSS custom properties (as specified in doc 07).

**Tasks**:
1. Create `libs/ui/src/styles/globals.css` with:
   - Tailwind import (`@import "tailwindcss"`)
   - All `:root` tokens (background, foreground, primary, secondary, muted, accent, destructive, warning, success, border, input, ring, sidebar, chart)
   - All `.dark` tokens
   - `@theme` directive mapping tokens to Tailwind colors
   - Base layer styles (body font, antialiasing)
2. Update `libs/ui/src/index.ts` to note that styles should be imported separately

**Files created**: 1 (`globals.css`)
**Verification**: CSS is valid, no syntax errors

---

### Step 4: Add workspace dependency

**Objective**: Make `@busmate/ui` consumable from the management portal.

**Tasks**:
1. Add `"@busmate/ui": "workspace:*"` to `apps/frontend/management-portal/package.json` dependencies
2. Add `"@busmate/ui"` to `next.config.ts` → `transpilePackages`
3. Add path alias in `apps/frontend/management-portal/tsconfig.json`:
   ```json
   { "@busmate/ui": ["../../../libs/ui/src/index.ts"], "@busmate/ui/*": ["../../../libs/ui/src/*"] }
   ```
4. Run `pnpm install`

**Files modified**: 3
**Verification**: Can import from `@busmate/ui` without errors

---

### Step 5: Add PostCSS compatibility

**Objective**: Ensure the management portal's PostCSS pipeline processes `@busmate/ui` styles.

**Tasks**:
1. Update `apps/frontend/management-portal/src/app/globals.css` to import `@busmate/ui/styles`:
   ```css
   @import "@busmate/ui/styles";
   /* Keep app-specific overrides below */
   ```
2. Verify that Tailwind processes the imported token CSS correctly
3. Run `pnpm dev` and check that the app still renders

**Files modified**: 1 (`globals.css`)
**Verification**: App starts, no CSS processing errors

---

## 3. Phase 2 — Design System Core

### Step 6: Generate shadcn/ui primitive components

**Objective**: Use the shadcn CLI to generate all needed primitive components.

**Tasks**:
1. Generate components into `libs/ui/src/components/`:
   ```bash
   pnpm dlx shadcn@latest add button badge card checkbox dialog \
     dropdown-menu input label radio-group select separator \
     sheet switch table tabs textarea toast avatar scroll-area \
     tooltip alert-dialog popover command --cwd libs/ui --path src/components
   ```
2. Export all from `libs/ui/src/index.ts`
3. Verify each component file exists

**Files created**: ~25 component files
**Verification**: All components export correctly

---

### Step 7: Generate additional primitives

**Objective**: Add remaining primitives needed for patterns.

**Tasks**:
1. Generate:
   ```bash
   pnpm dlx shadcn@latest add skeleton calendar collapsible \
     accordion progress slider toggle toggle-group \
     --cwd libs/ui --path src/components
   ```
2. Export all from barrel

**Files created**: ~8 component files
**Verification**: Exports work

---

### Step 8: Create `cn()` utility and hooks

**Objective**: Set up shared utilities.

**Tasks**:
1. Create `libs/ui/src/lib/utils.ts`:
   ```ts
   import { type ClassValue, clsx } from "clsx";
   import { twMerge } from "tailwind-merge";
   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```
2. Create `libs/ui/src/hooks/use-media-query.ts`
3. Create `libs/ui/src/hooks/use-mobile.ts`
4. Export from barrel

**Files created**: 3
**Verification**: Can import `cn`, `useMediaQuery`, `useMobile` from `@busmate/ui`

---

### Step 9: Create ButtonVariants with CVA

**Objective**: Ensure Button has all variants needed by BusMate.

**Tasks**:
1. Verify shadcn Button has variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
2. Add custom variant `success` if needed:
   ```ts
   success: "bg-success text-success-foreground hover:bg-success/90",
   ```
3. Add sizes: `default`, `sm`, `lg`, `icon`
4. Export `buttonVariants` from barrel for use in non-button components

**Files modified**: 1 (`button.tsx`)
**Verification**: All variant/size combinations render correctly

---

### Step 10: Create StatusBadge pattern component

**Objective**: Build the unified `StatusBadge` from doc 06.

**Tasks**:
1. Create `libs/ui/src/patterns/status-badge/status-badge.tsx` (as defined in doc 06)
2. Create `libs/ui/src/patterns/status-badge/index.ts` barrel
3. Export from main barrel

**Files created**: 2
**Verification**: `<StatusBadge status="active" />` renders green badge

---

### Step 11: Create StatsCard pattern

**Objective**: Build the unified `StatsCard` and `StatsCardGrid` from doc 06.

**Tasks**:
1. Create `libs/ui/src/patterns/stats-card/stats-card.tsx`
2. Create `libs/ui/src/patterns/stats-card/stats-card-grid.tsx`
3. Create `libs/ui/src/patterns/stats-card/index.ts` barrel
4. Export from main barrel

**Files created**: 3
**Verification**: Renders card with title, value, icon, trend

---

### Step 12: Create ConfirmDialog and FormDialog

**Objective**: Build unified dialog patterns from doc 06.

**Tasks**:
1. Create `libs/ui/src/patterns/dialogs/confirm-dialog.tsx`
2. Create `libs/ui/src/patterns/dialogs/form-dialog.tsx`
3. Create `libs/ui/src/patterns/dialogs/use-dialog.ts`
4. Create `libs/ui/src/patterns/dialogs/index.ts` barrel
5. Export from main barrel

**Files created**: 4
**Verification**: Dialog opens/closes, confirm fires callback

---

## 4. Phase 3 — Pattern Library

### Step 13: Create DataTable column types

**Objective**: Define the `ColumnDef` type system.

**Tasks**:
1. Create `libs/ui/src/patterns/data-table/types.ts` with `ColumnDef<TData>` and `DataTableProps<TData>`
2. Create `libs/ui/src/patterns/data-table/index.ts` barrel

**Files created**: 2

---

### Step 14: Create useDataTable hook

**Objective**: Build the state management hook for DataTable.

**Tasks**:
1. Create `libs/ui/src/patterns/data-table/use-data-table.ts` (as defined in doc 06)
2. Export from barrel

**Files created**: 1
**Verification**: Hook manages page, sort, filter, selection state

---

### Step 15: Create DataTablePagination

**Objective**: Build a single pagination component replacing the 3 duplicates.

**Tasks**:
1. Create `libs/ui/src/patterns/data-table/data-table-pagination.tsx`
   - Page navigation (prev/next, page numbers)
   - Page size selector (10, 20, 50, 100)
   - Total items display
2. Export from barrel

**Files created**: 1
**Verification**: Renders pagination with correct page count and controls

---

### Step 16: Create DataTable component

**Objective**: Build the main DataTable component.

**Tasks**:
1. Create `libs/ui/src/patterns/data-table/data-table.tsx` (as defined in doc 06)
2. Supports: sorting, selection, loading, empty state, row actions, column hiding on mobile
3. Export from barrel and main barrel

**Files created**: 1
**Verification**: Renders table with all features

---

### Step 17: Create FilterBar pattern

**Objective**: Build the `FilterBar`, `FilterSelect`, and related components.

**Tasks**:
1. Create `libs/ui/src/patterns/filter-bar/filter-bar.tsx`
2. Create `libs/ui/src/patterns/filter-bar/filter-select.tsx`
3. Create `libs/ui/src/patterns/filter-bar/index.ts`
4. Export from main barrel

**Files created**: 3
**Verification**: Search + dropdown filters render, mobile filter sheet works

---

### Step 18: Create Form pattern components

**Objective**: Build `FormWrapper`, `FormSection`, `FormGrid`.

**Tasks**:
1. Create `libs/ui/src/patterns/form/form-wrapper.tsx`
2. Create `libs/ui/src/patterns/form/form-section.tsx`
3. Create `libs/ui/src/patterns/form/form-grid.tsx`
4. Create `libs/ui/src/patterns/form/index.ts`
5. Export from main barrel

**Files created**: 4

---

### Step 19: Create EmptyState pattern

**Objective**: Build the `EmptyState` component.

**Tasks**:
1. Create `libs/ui/src/patterns/empty-state/empty-state.tsx`
2. Create `libs/ui/src/patterns/empty-state/index.ts`

**Files created**: 2

---

### Step 20: Create ActivityLog and DashboardGrid patterns

**Objective**: Build dashboard-specific patterns.

**Tasks**:
1. Create `libs/ui/src/patterns/activity-log/activity-log.tsx`
2. Create `libs/ui/src/patterns/activity-log/index.ts`
3. Create `libs/ui/src/patterns/dashboard/dashboard-grid.tsx`
4. Create `libs/ui/src/patterns/dashboard/index.ts`
5. Create `libs/ui/src/patterns/map/map-container.tsx`
6. Create `libs/ui/src/patterns/map/index.ts`
7. Update main barrel with all pattern exports

**Files created**: 6

---

## 5. Phase 4 — Layout Migration

### Step 21: Create AppShell layout component

**Objective**: Build the `AppShell` from doc 05.

**Tasks**:
1. Create `libs/ui/src/layouts/app-shell.tsx`
2. Create `libs/ui/src/layouts/mobile-app-shell.tsx`
3. Create `libs/ui/src/layouts/responsive-shell.tsx`
4. Export from barrel

**Files created**: 3

---

### Step 22: Create Sidebar component

**Objective**: Build the data-driven `Sidebar` from doc 05.

**Tasks**:
1. Create `libs/ui/src/layouts/sidebar/sidebar.tsx`
2. Create `libs/ui/src/layouts/sidebar/types.ts`
3. Create `libs/ui/src/layouts/sidebar/index.ts`
4. Export from main barrel

**Files created**: 3
**Verification**: Sidebar renders nav items, collapses, shows tooltips

---

### Step 23: Create Header component

**Objective**: Build the unified `Header` component from doc 05.

**Tasks**:
1. Create `libs/ui/src/layouts/header/header.tsx`
2. Create `libs/ui/src/layouts/header/index.ts`
3. Export from barrel

**Files created**: 2

---

### Step 24: Create content layout components

**Objective**: Build `PageContainer` and `Section`.

**Tasks**:
1. Create `libs/ui/src/layouts/content/page-container.tsx`
2. Create `libs/ui/src/layouts/content/section.tsx`
3. Create `libs/ui/src/layouts/content/index.ts`
4. Export from main barrel

**Files created**: 3

---

### Step 25: Create navigation config files

**Objective**: Move navigation data from component code to config files.

**Tasks**:
1. Create `apps/frontend/management-portal/src/config/navigation.ts` with:
   - `motNavigation`
   - `adminNavigation`
   - `operatorNavigation`
   - `timekeeperNavigation`
2. Each config uses the `NavigationConfig` type from `@busmate/ui`

**Files created**: 1

---

### Step 26: Migrate role layouts to AppShell

**Objective**: Replace current LayoutClient/SidebarClient with AppShell + Sidebar.

**Substeps** (do one role at a time):

#### Step 26a: Migrate MOT layout

**Tasks**:
1. Create `src/components/layouts/mot-layout-client.tsx` using `AppShell` + `Sidebar` + `Header`
2. Update `src/app/mot/layout.tsx` to use new layout
3. Verify MOT portal renders correctly
4. Keep old `SidebarClient.tsx` intact (other roles still use it)

**Files created**: 1
**Files modified**: 1

#### Step 26b: Migrate Admin layout

**Tasks**: Same pattern as 26a for Admin.

#### Step 26c: Migrate Operator layout

**Tasks**: Same pattern as 26a for Operator.

#### Step 26d: Migrate Timekeeper layout

**Tasks**: Same pattern as 26a for Timekeeper.

#### Step 26e: Remove old layout components

**Tasks**:
1. Delete `src/components/shared/SidebarClient.tsx` (427 lines)
2. Delete `src/components/shared/LayoutClient.tsx`
3. Delete role-specific content header components
4. Update `src/components/shared/base.ts` barrel

**Files deleted**: 5+
**Verification**: All 4 portals render correctly with new layouts

---

## 6. Phase 5 — Feature Module Migration

### Migration Order

Migrate features in this order (least complex first, most dependencies last):

1. **Bus Stops** (26a) — medium complexity, good reference implementation
2. **Routes** (27) — complex (workspace context), high-impact
3. **Operators** (28) — simple CRUD
4. **Staff Management** (29) — simple CRUD with role variations
5. **Permits** (30) — medium complexity
6. **Fleet Management** (31) — operator-specific
7. **Trips** (32) — multi-role shared feature
8. **Schedules** (33) — complex (workspace context)
9. **Fares** (34) — medium complexity
10. **Analytics** (35) — charts/dashboards
11. **Dashboards** (36) — all role dashboards
12. **Notifications** (37) — simple
13. **Settings/Policies** (38) — simple
14. **Location Tracking** (39) — map-heavy
15. **AI Studio** (40) — unique, migrate last

### Feature Migration Template

Each feature follows this pattern (using Bus Stops as the example):

#### Step 27: Migrate Bus Stops feature

**Objective**: Refactor bus stops from monolithic page component to pattern-composed architecture.

**Current state**:
- `src/app/mot/bus-stops/page.tsx` — 555 lines, ~30 useState calls
- `src/components/mot/bus-stops/` — BusStopsTable, BusStopsStatsCards, BusStopsFilterBar, etc. (8+ files)

**Target state**:
- Page: ~50 lines (orchestrator only)
- Feature components: compose from shared patterns

**Tasks**:

1. **Create column definition** (`src/components/mot/bus-stops/bus-stops-columns.tsx`):
   - Define `ColumnDef<BusStop>[]` using `@busmate/ui` types
   - Include StatusBadge for status column

2. **Create BusStopsTable** (`src/components/mot/bus-stops/bus-stops-table.tsx`):
   - Compose `DataTable` from `@busmate/ui` with bus-stop columns
   - Pass through sort/page/filter props

3. **Create BusStopsFilterBar** (`src/components/mot/bus-stops/bus-stops-filter-bar.tsx`):
   - Compose `FilterBar` + `FilterSelect` from `@busmate/ui`
   - Bus-stop-specific filter options (status, district, type)

4. **Create BusStopsStatsCards** (`src/components/mot/bus-stops/bus-stops-stats-cards.tsx`):
   - Compose `StatsCardGrid` + `StatsCard` from `@busmate/ui`
   - Bus-stop-specific KPIs

5. **Refactor page** (`src/app/mot/bus-stops/page.tsx`):
   - Use `useDataTable` hook for state
   - Compose feature components
   - Use `useDialog` for delete confirmation
   - Target: ~50 lines

6. **Delete old components** that are now replaced

7. **Verify**: Bus Stops page works — list, filter, sort, paginate, delete

---

#### Steps 28-40: Repeat for each feature

Each feature module follows the same template:

1. Define columns (if table-based)
2. Create feature table component
3. Create feature filter bar
4. Create feature stats cards (if applicable)
5. Refactor page to orchestrator pattern
6. Delete replaced components
7. Verify functionality

**Key differences by feature**:

| Feature | Special Considerations |
|---------|----------------------|
| Routes | Workspace context (YAML/JSON state), map integration, stop ordering via drag-and-drop |
| Schedules | Workspace context, calendar integration, exception handling |
| Trips | Shared across MOT/Operator/Timekeeper — use same feature components |
| Fleet | Operator-only, bus assignment logic |
| Analytics | Chart.js/Recharts integration, DashboardGrid pattern |
| Dashboards | Role-specific KPIs, use DashboardGrid + StatsCardGrid |
| Location Tracking | Google Maps, real-time bus locations |
| AI Studio | Gemini API integration, unique chat-like UI — minimal pattern usage |

---

## 7. Phase 6 — Polish & Cleanup

### Step 41: Implement dark mode

**Objective**: Enable dark mode across the entire app.

**Tasks**:
1. Add `ThemeProvider` from `next-themes` to root layout
2. Add `ThemeSwitcher` component to User Actions area
3. Verify all components render correctly in dark mode
4. Fix any hardcoded colors that don't respond to dark mode
5. Add AG Grid dark theme toggling

**Verification**: Toggle between light/dark/system — all pages look correct

---

### Step 42: Remove old shared components

**Objective**: Delete all deprecated shared components.

**Tasks**:
1. Delete `src/components/shared/DataTable.tsx` (325 lines)
2. Delete `src/components/shared/SearchFilterBar.tsx` (626 lines)
3. Delete `src/components/shared/StatsCard.tsx` (253 lines)
4. Delete `src/components/shared/DataPagination.tsx` (306 lines)
5. Delete `src/components/shared/ActionButton.tsx` (256 lines)
6. Delete `src/components/shared/SwitchableTabs.tsx` (123 lines)
7. Delete `src/components/shared/Pagination.tsx`
8. Delete `src/components/shared/StatsCardsContainer.tsx`
9. Update `src/components/shared/base.ts` barrel

**Verification**: No imports reference deleted files, app compiles

---

### Step 43: Remove old ui/ components

**Objective**: Delete the 17 manually-copied shadcn components now replaced by `@busmate/ui`.

**Tasks**:
1. Search all imports from `@/components/ui/*`
2. Replace with imports from `@busmate/ui`
3. Delete all files in `src/components/ui/`
4. Remove the `src/components/ui/` directory

**Verification**: App compiles, no broken imports

---

### Step 44: Apply consistent naming conventions

**Objective**: Standardize file naming across the project.

**Tasks**:
1. Rename any remaining PascalCase files to kebab-case (e.g., `UserActions.tsx` → `user-actions.tsx`)
2. Update all imports
3. Ensure all component files follow `{feature}-{descriptor}.tsx` pattern

**Verification**: Consistent naming, app compiles

---

### Step 45: Accessibility audit

**Objective**: Ensure WCAG 2.1 AA compliance.

**Tasks**:
1. Verify all interactive elements have accessible names (`aria-label`, `sr-only`)
2. Check contrast ratios on all token combinations
3. Verify keyboard navigation works for sidebar, tables, dialogs, forms
4. Add `role` attributes where needed
5. Ensure focus trap works in all dialogs/sheets

---

### Step 46: Final verification

**Objective**: Full regression check.

**Tasks**:
1. Run `pnpm build` — ensure no build errors
2. Run `pnpm typecheck` — ensure no type errors
3. Navigate every page in every role portal
4. Test mobile viewport (320px, 768px, 1024px)
5. Test dark mode on every page
6. Run existing E2E tests
7. Document any breaking changes

---

## 8. Execution Rules for AI Agents

### Rule 1: One Step at a Time

Execute exactly one step before checking if the app still compiles and runs. Never skip ahead.

### Rule 2: Verify Before Moving On

After each step:
```bash
# Type check
pnpm tsc --noEmit

# Build check (if step creates new exports)
pnpm build

# Visual check (if step changes UI)
# Open the app and navigate to affected pages
```

### Rule 3: Preserve Functionality

Never delete old code until the new replacement is verified working. Create alongside, migrate references, then delete.

### Rule 4: Import Path Convention

When migrating imports:
```tsx
// Old import
import { DataTable } from "@/components/shared/DataTable";

// New import
import { DataTable } from "@busmate/ui";
```

### Rule 5: Commit Boundaries

Each step (or substep like 26a, 26b, etc.) should be one git commit with a descriptive message:

```
feat(ui): initialize @busmate/ui shared library [Step 1]
feat(ui): set up shadcn CLI configuration [Step 2]
feat(ui): add design tokens CSS [Step 3]
feat(ui): migrate MOT layout to AppShell [Step 26a]
refactor(bus-stops): compose from shared patterns [Step 27]
```

### Rule 6: Don't Over-Engineer

If a feature component is used in only one place, don't create an abstraction. Just refactor it to use the shared patterns directly.

### Rule 7: Handle Edge Cases

When migrating features, watch for:
- Dynamic imports (`next/dynamic`)
- Server components vs client components
- Context providers that need to wrap certain routes
- API client calls that happen in feature components (leave these in place)
- Google Maps integration (keep existing `useGoogleMaps` hook)

### Rule 8: Test Coverage

After each feature migration (Steps 27-40):
1. Verify the feature works in the browser
2. Run any existing unit tests
3. Run any existing E2E tests that cover the feature
4. If tests fail, fix before proceeding

---

## Migration Dependency Graph

```
Step 1-5 (Foundation)
  ↓
Step 6-9 (Primitives)
  ↓
Step 10-12 (Simple Patterns: StatusBadge, StatsCard, Dialogs)
  ↓
Step 13-20 (Complex Patterns: DataTable, FilterBar, Forms)
  ↓
Step 21-24 (Layout Components)
  ↓
Step 25 (Nav Config)
  ↓
Step 26a-d (Layout Migration per role) ← can be parallelized
  ↓
Step 26e (Remove old layouts)
  ↓
Step 27-40 (Feature Migrations) ← sequential, bus-stops first as reference
  ↓
Step 41-46 (Polish)
```

---

## Next Steps

Proceed to **[09 — Long-Term UI Maintenance Guidelines](./09-long-term-ui-maintenance-guidelines.md)** for the rules and practices that keep the design system healthy after migration.
