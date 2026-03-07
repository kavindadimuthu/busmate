# 01 — UI Refactoring Strategy

> **Scope**: BusMate Management Portal (`apps/frontend/management-portal`)
> **Goal**: Safely migrate from the current unstructured UI to a modern, scalable design system powered by shadcn/ui.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Problems in the Current UI Architecture](#2-problems-in-the-current-ui-architecture)
3. [Why a Design System Is Required](#3-why-a-design-system-is-required)
4. [Refactoring Philosophy](#4-refactoring-philosophy)
5. [Safe Refactoring Strategy](#5-safe-refactoring-strategy)
6. [Risk Assessment & Mitigation](#6-risk-assessment--mitigation)
7. [Success Criteria](#7-success-criteria)

---

## 1. Current State Analysis

### Architecture Overview

```
apps/frontend/management-portal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin portal routes
│   │   ├── mot/                # MOT (Ministry of Transport) portal routes
│   │   ├── operator/           # Operator portal routes
│   │   └── timekeeper/         # Timekeeper portal routes
│   ├── components/
│   │   ├── ui/                 # 17 shadcn-style primitive components (manually copied)
│   │   ├── shared/             # 14 shared components (DataTable, Sidebar, etc.)
│   │   ├── mot/                # ~90+ MOT feature components
│   │   ├── admin/              # ~30+ Admin feature components
│   │   ├── operator/           # ~35+ Operator feature components
│   │   ├── timekeeper/         # ~10 Timekeeper feature components
│   │   └── tools/              # CSV editor tools
│   ├── context/                # 3 context providers (Page, RouteWorkspace, ScheduleWorkspace)
│   ├── data/                   # Mock data files per role
│   ├── hooks/                  # 9 custom hooks
│   ├── lib/                    # API setup, utilities, services
│   ├── services/               # Business logic services (route generation, AI, serialization)
│   ├── types/                  # TypeScript type definitions
│   └── validation-rules/       # Validation logic
```

### Tech Stack

| Technology | Version | Notes |
|-----------|---------|-------|
| Next.js | 16 | App Router |
| React | 19 | Latest |
| Tailwind CSS | 4 | CSS-based config (no `tailwind.config.ts`) |
| TypeScript | 5 | `ignoreBuildErrors: true` in next.config |
| Radix UI | Various | ~20 packages installed |
| shadcn/ui | Partial | 17 components manually copied, no `components.json` |
| Lucide React | 0.522 | Icon library |

### Current Component Count

| Area | Approximate Count |
|------|-------------------|
| UI Primitives (`ui/`) | 17 files |
| Shared Components (`shared/`) | 14 files |
| MOT Components (`mot/`) | ~90+ files |
| Admin Components (`admin/`) | ~30+ files |
| Operator Components (`operator/`) | ~35+ files |
| Timekeeper Components (`timekeeper/`) | ~10 files |
| **Total** | **~200+ component files** |

---

## 2. Problems in the Current UI Architecture

### 2.1 No Design Token System

**Problem**: Colors, spacing, border-radius, and typography are hardcoded throughout every component using raw Tailwind utilities.

```tsx
// ❌ Current pattern — scattered across 200+ files
<div className="bg-blue-600 text-white rounded-lg p-4 shadow-md">
<span className="text-gray-500 text-sm font-medium">
<button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md">
```

**Impact**: Changing the brand's primary color requires finding and replacing values across hundreds of files. Inconsistencies multiply as the codebase grows.

### 2.2 Duplicate Components

**Problem**: Multiple versions of the same pattern exist without consolidation.

| Pattern | Duplicates |
|---------|-----------|
| Pagination | `shared/Pagination.tsx`, `shared/DataPagination.tsx`, `mot/pagination.tsx` |
| Confirmation dialogs | `mot/confirmation-modals.tsx`, `DeleteBusStopModal`, `DeleteBusModal`, `DeleteRouteConfirmation`, `DeleteStaffModal`, `DeletePolicyModal`, `DeletePermitModal`, `admin/ConfirmDialog` |
| Stats cards | `StatsCard` (shared) + role-specific wrappers that re-implement similar logic |
| Tables | Custom `DataTable` (shared) + shadcn `ui/table.tsx` (unused) |
| Content headers | 4 separate role-specific headers with similar structure |

**Impact**: Bug fixes must be applied to multiple files. New developers don't know which version to use.

### 2.3 Oversized Page Components

**Problem**: Pages contain all state management, data fetching, and composition logic in a single client component.

```
Bus Stops Page: 555 lines
  - State declarations: ~30 useState calls
  - Data fetching: inline useEffect/useCallback
  - UI composition: Stats + Filters + Table + Pagination
  - Event handlers: sort, filter, search, CRUD actions
```

**Impact**: Pages are difficult to test, reason about, and modify. Each change risks breaking unrelated functionality.

### 2.4 Inconsistent Patterns Across Roles

**Problem**: MOT, Admin, Operator, and Timekeeper portals implement similar features (dashboards, tables, filters) but with different structures and naming conventions.

```
MOT:      RoutesTable, RouteStatsCards, RouteActionButtons, RouteAdvancedFilters
Admin:    UsersTable, UserStatsCards, UserActionButtons, UserAdvancedFilters
Operator: FleetTable, FleetStatsCards, FleetFilters  ← different naming
```

**Impact**: Knowledge doesn't transfer between modules. Each new feature starts from scratch instead of composing shared patterns.

### 2.5 No Theme or Dark Mode Support

**Problem**: 
- No CSS custom properties for theming
- `globals.css` contains only `@import "tailwindcss"` and a single animation
- Some `ui/` components include `dark:` prefixes but the app has no theme provider
- No mechanism to switch between light/dark mode or customize brand colors

**Impact**: Adding theme support later requires touching every component. The application cannot adapt to different branding contexts.

### 2.6 No Formal shadcn Setup

**Problem**: shadcn components were manually copied without the CLI workflow:
- No `components.json` configuration file
- No standardized generation process
- Components may have been modified inconsistently

**Impact**: Cannot use `npx shadcn@latest add <component>` to add or update components. Manual updates risk breaking customizations.

### 2.7 Missing Accessibility Infrastructure

**Problem**: No consistent approach to keyboard navigation, focus management, screen reader support, or ARIA patterns across custom components. Radix primitives handle some of this, but custom components like `DataTable` and `SearchFilterBar` lack systematic a11y coverage.

### 2.8 No Responsive Design Strategy

**Problem**: Sidebar uses fixed pixel widths (`ml-20`, `ml-68`) with no mobile breakpoint handling. The `use-mobile.tsx` hook exists but is not widely used. No responsive layout patterns are defined.

---

## 3. Why a Design System Is Required

### 3.1 Consistency at Scale

BusMate has **4 role-based portals** with **16+ feature modules** and **200+ components**. Without a design system, visual and behavioral consistency degrades as the team scales and features multiply.

### 3.2 Development Velocity

A design system provides pre-built, tested patterns that developers compose rather than build from scratch:

```
Without design system:  Feature → Design → Build components → Style → Test → Ship
With design system:     Feature → Compose patterns → Customize → Ship
```

**Estimated time savings**: 40-60% reduction in UI implementation time for new features.

### 3.3 Brand Control

A token-based design system allows:
- Theme changes via a single configuration file
- Light/dark mode implementation in hours, not weeks
- White-labeling capability for different operators or agencies

### 3.4 Quality & Accessibility

Centralizing component logic means:
- Accessibility fixes apply everywhere at once
- Keyboard navigation patterns are consistent
- ARIA attributes are correct by default
- Edge cases are handled systematically

### 3.5 Onboarding & Documentation

New developers can:
- Understand the full component inventory
- Know exactly which component to use for each pattern
- Follow established conventions instead of inventing approaches

---

## 4. Refactoring Philosophy

### 4.1 Principles

| Principle | Description |
|-----------|-------------|
| **Incremental migration** | Never rewrite everything at once. Migrate feature-by-feature. |
| **Parallel operation** | Old and new components coexist during migration. No big-bang switches. |
| **Bottom-up** | Start with design tokens → primitives → patterns → features → pages. |
| **Test gate** | Each migration step must pass E2E tests before proceeding. |
| **Zero visual regression** | Users should not notice the refactoring (unless the design intentionally improves). |
| **Preserve working features** | The complex workspace contexts (Route, Schedule) and AI features work well — don't break them. |

### 4.2 Migration Approach: Strangler Fig Pattern

```
┌─────────────────────────────────────────────────────┐
│                  BusMate Application                  │
│                                                       │
│  ┌─────────────────┐    ┌──────────────────────────┐ │
│  │  Legacy Layer    │    │   New Design System       │ │
│  │  (current code)  │◄──►│   (shadcn + tokens)      │ │
│  │                  │    │                           │ │
│  │  Gradually       │    │   Grows as features       │ │
│  │  shrinks         │    │   are migrated            │ │
│  └─────────────────┘    └──────────────────────────┘ │
│                                                       │
│  Phase 1: Foundation    ━━━━━●                        │
│  Phase 2: Core patterns ━━━━━━━━━●                    │
│  Phase 3: Feature pages ━━━━━━━━━━━━━━●               │
│  Phase 4: Full migration━━━━━━━━━━━━━━━━━━●           │
└─────────────────────────────────────────────────────┘
```

Old components are not deleted until their replacement is verified. Features are migrated one-by-one. Both systems run simultaneously through shared Tailwind configuration.

### 4.3 What NOT to Refactor

Certain parts of the codebase are complex, working, and should be preserved:

| Area | Reason |
|------|--------|
| Route Workspace Context | Complex state management with YAML/JSON serialization — stable and well-structured |
| Schedule Workspace Context | Same — intricate calendar/exception logic |
| AI Studio integration | Gemini service integration — domain-specific, not UI architecture |
| API client libraries | Auto-generated from OpenAPI — untouched |
| Auth flow (Asgardeo) | Working auth middleware — out of scope |
| Next.js routing structure | 4-role portal structure is sound |

---

## 5. Safe Refactoring Strategy

### 5.1 Phase Overview

```
Phase 0: Foundation Setup          (Days 1-3)
  └── shadcn CLI, design tokens, Tailwind config

Phase 1: Core Component Migration  (Days 4-10)
  └── Primitives, shared components, layout

Phase 2: Pattern Library           (Days 11-18)
  └── DataTable, FilterBar, Forms, Dialogs, Stats

Phase 3: Feature Migration         (Days 19-35)
  └── MOT → Admin → Operator → Timekeeper pages

Phase 4: Cleanup & Documentation   (Days 36-40)
  └── Remove legacy, document, validate
```

### 5.2 File-Level Migration Strategy

For each component being migrated:

```
1. CREATE   new version using design system patterns
2. TEST     new version visually and functionally
3. SWAP     page imports from old → new component
4. VERIFY   E2E tests pass
5. DELETE   old component (after all consumers are migrated)
```

### 5.3 Import Alias Strategy

During migration, use barrel exports to abstract component locations:

```typescript
// libs/ui/components/index.ts (new design system)
export { Button } from './button';
export { DataTable } from '../patterns/data-table';

// Feature pages import from the design system
import { Button, DataTable } from '@busmate/ui';
```

This lets us swap implementations without changing consumer code.

### 5.4 Backward Compatibility

During migration, ensure:

1. **Both old and new UI components can render** on the same page
2. **Shared Tailwind classes work** for both systems (CSS custom properties + utility classes)
3. **Props remain compatible** — new components accept at least the same props as old ones
4. **Event handlers are preserved** — onClick, onChange, onSort etc. remain identical

---

## 6. Risk Assessment & Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Visual regressions during migration** | High | Medium | E2E visual snapshots before/after each migration step |
| **Breaking workspace features** (Route/Schedule editors) | Medium | Critical | Migrate workspace components last; preserve context providers intact |
| **Tailwind v4 + shadcn compatibility issues** | Medium | High | Test shadcn CLI with Tailwind v4 early; document any workarounds |
| **Performance degradation from added abstraction** | Low | Medium | Benchmark key pages before/after; use React DevTools profiler |
| **Team velocity drop during migration** | High | Medium | Migrate in small PRs; maintain feature development in parallel |
| **Inconsistent migration state** | Medium | Medium | Track migration progress per feature module; clear completion criteria |
| **Design token conflicts with hardcoded values** | High | Low | Gradual token adoption; eslint rule to flag hardcoded colors |
| **Auth/API breaking during layout refactor** | Low | Critical | Layout refactoring preserves server component boundaries and auth checks |

### Critical Guardrails

1. **E2E test suite must pass** after every migration step (existing Playwright tests in `tests/e2e/`)
2. **No TypeScript `any` types** introduced during migration
3. **No increase in bundle size** > 5% per migration step
4. **Accessibility audit** (axe-core) at each phase gate
5. **Git branches per phase** with squash merges to main

### Rollback Strategy

Each phase is a separate branch. If a phase introduces regressions:

```
1. Revert the phase branch merge
2. Fix issues in the phase branch
3. Re-merge after verification
```

---

## 7. Success Criteria

### Phase 0 Complete When:
- [ ] `components.json` exists and `npx shadcn@latest add button` works
- [ ] CSS custom properties defined for all design tokens
- [ ] Tailwind extended with token references
- [ ] `cn()` utility available in shared UI library

### Phase 1 Complete When:
- [ ] All 17 `ui/` components regenerated via shadcn CLI
- [ ] Shared `DataTable`, `SearchFilterBar`, `StatsCard` migrated to design tokens
- [ ] Layout system (sidebar, header, content) uses CSS variables
- [ ] Zero visual regressions confirmed

### Phase 2 Complete When:
- [ ] Reusable pattern library established (data-table, filter-bar, form, dialog, stats-card)
- [ ] Duplicate components consolidated (3 paginations → 1, 8+ delete modals → 1 pattern)
- [ ] All patterns use design tokens exclusively

### Phase 3 Complete When:
- [ ] All 4 portal dashboards migrated
- [ ] All feature tables/lists migrated
- [ ] All forms migrated
- [ ] E2E tests pass for all portals

### Phase 4 Complete When:
- [ ] Zero hardcoded color values outside of design token definitions
- [ ] All legacy/duplicate components deleted
- [ ] Component documentation exists
- [ ] Light/dark mode functional
- [ ] Accessibility audit passes (WCAG 2.1 AA)

---

## Next Steps

Proceed to **[02 — Design System Architecture](./02-design-system-architecture.md)** to define the token system, color palette, typography, and design principles that will form the foundation of the refactored UI.
