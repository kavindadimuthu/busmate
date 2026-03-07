# 09 — Long-Term UI Maintenance Guidelines

> **Scope**: Rules, practices, and processes that keep the BusMate design system healthy, consistent, and scalable after migration.
> **Goal**: Prevent design system decay, duplication, and inconsistency as the project grows.

---

## Table of Contents

1. [Design System Governance](#1-design-system-governance)
2. [Adding New Components](#2-adding-new-components)
3. [Modifying Existing Components](#3-modifying-existing-components)
4. [Code Review Checklist](#4-code-review-checklist)
5. [Import Rules](#5-import-rules)
6. [Anti-Patterns](#6-anti-patterns)
7. [File Naming & Organization](#7-file-naming--organization)
8. [Token Management](#8-token-management)
9. [Dependency Management](#9-dependency-management)
10. [Scaling for New Modules](#10-scaling-for-new-modules)
11. [Performance Guidelines](#11-performance-guidelines)
12. [Documentation Standards](#12-documentation-standards)

---

## 1. Design System Governance

### Ownership

| Layer | Owner | Review Required |
|-------|-------|----------------|
| `libs/ui/` (primitives, patterns, layouts) | Design System team / Lead dev | Yes — always |
| `src/config/navigation.ts` | Feature team | Yes — for new nav items |
| `src/components/{role}/{feature}/` | Feature team | Peer review |
| `src/app/{role}/{feature}/page.tsx` | Feature team | Peer review |

### Change Flow

```
Proposal → Design System Review → Implementation → PR Review → Merge
```

For changes to `libs/ui/`:
1. **Proposal**: Describe the change and why it's needed
2. **Impact check**: What existing components/pages are affected?
3. **Implementation**: Make the change with backward compatibility
4. **Testing**: Verify all consumers still work
5. **PR Review**: Must be approved by a design system maintainer

---

## 2. Adding New Components

### Decision Tree: Where Does It Go?

```
Is it used by 2+ feature modules?
  ├── YES → Is it domain-agnostic (no BusMate-specific logic)?
  │           ├── YES → libs/ui/src/patterns/
  │           └── NO  → src/components/shared/
  └── NO  → src/components/{role}/{feature}/
```

### Step-by-Step: Adding a New Pattern

1. **Check if it already exists** in `libs/ui/src/patterns/`
2. **Check shadcn registry** — can it be generated with `pnpm dlx shadcn@latest add`?
3. If neither, create manually:
   ```
   libs/ui/src/patterns/{pattern-name}/
     {pattern-name}.tsx       ← Component
     {pattern-name}.test.tsx  ← Tests (optional)
     index.ts                 ← Barrel export
   ```
4. Export from `libs/ui/src/index.ts`
5. Document usage in this file or pattern catalog

### Step-by-Step: Adding a New Feature Component

1. Create in the correct directory:
   ```
   src/components/{role}/{feature}/
     {feature}-table.tsx
     {feature}-filter-bar.tsx
     {feature}-stats-cards.tsx
     {feature}-form.tsx
     {feature}-row-actions.tsx
   ```
2. Compose from `@busmate/ui` patterns — never copy pattern code
3. Feature components should be "thin wrappers" — mostly configuration, not logic

### Checklist Before Adding Any Component

- [ ] Does a similar component already exist in `libs/ui/` or `src/components/shared/`?
- [ ] Does it use semantic tokens (not raw colors)?
- [ ] Does it work in both light and dark mode?
- [ ] Does it follow the naming convention?
- [ ] Does it accept only the props it needs (no prop drilling)?
- [ ] Is it accessible (keyboard nav, ARIA attributes, contrast)?

---

## 3. Modifying Existing Components

### Rules for `libs/ui/` Changes

1. **Backward compatible by default** — add new props with defaults, don't remove existing props
2. **Breaking changes require migration** — if a prop is removed or renamed, update all consumers first
3. **No feature-specific logic** — `libs/ui/` components must remain domain-agnostic
4. **Test dark mode** — every visual change must be checked in both themes

### Deprecation Process

If a component or prop needs to be removed:

1. Add `@deprecated` JSDoc comment with replacement instructions
2. Add `console.warn()` in development mode
3. Create a migration PR that updates all consumers
4. Remove (2 sprints later) after all consumers are migrated

```tsx
/** @deprecated Use `StatusBadge` from @busmate/ui instead */
export function OldStatusChip(props: OldStatusChipProps) {
  if (process.env.NODE_ENV === "development") {
    console.warn("OldStatusChip is deprecated. Use StatusBadge from @busmate/ui.");
  }
  return <StatusBadge {...mapOldToNew(props)} />;
}
```

---

## 4. Code Review Checklist

### UI-Specific Review Points

Every PR that touches UI code should be checked against:

**Tokens & Theming**
- [ ] No hardcoded colors (`bg-blue-600`, `text-gray-500`, `#xxx`)
- [ ] Uses semantic tokens (`bg-primary`, `text-muted-foreground`)
- [ ] Works in dark mode
- [ ] No `style={{ color: ... }}` for theming purposes

**Component Architecture**
- [ ] No duplication of existing patterns
- [ ] Imports from `@busmate/ui` (not `@/components/ui/`)
- [ ] Page files are ≤100 lines (orchestrator pattern)
- [ ] Feature components compose from shared patterns
- [ ] No business logic in pattern components

**Accessibility**
- [ ] Interactive elements have accessible names
- [ ] Focus management works (dialogs, sheets)
- [ ] Color is not the only indicator of state
- [ ] Proper heading hierarchy (h1 → h2 → h3)

**Responsiveness**
- [ ] Mobile layout works (check at 375px)
- [ ] Tables hide non-essential columns on mobile
- [ ] Forms stack to single column on mobile

**Performance**
- [ ] No unnecessary re-renders (memo where needed)
- [ ] No large inline objects/arrays in render
- [ ] Images use `next/image` with proper sizing
- [ ] Lists use virtualization if >100 items

---

## 5. Import Rules

### Enforced Import Hierarchy

```
Page → Feature Component → Pattern (libs/ui) → Primitive (libs/ui)
```

| Source | Can Import From | Cannot Import From |
|--------|----------------|-------------------|
| `libs/ui/src/patterns/` | `libs/ui/src/components/` (primitives) | feature components, app code |
| `libs/ui/src/layouts/` | `libs/ui/src/components/`, `libs/ui/src/patterns/` | app code |
| `src/components/{role}/{feature}/` | `@busmate/ui`, `src/hooks/`, `src/types/`, `src/services/` | other feature modules |
| `src/app/{role}/{feature}/page.tsx` | `src/components/{role}/{feature}/`, `@busmate/ui` | other role's components |

### Forbidden Import Patterns

```tsx
// ❌ Pattern importing from app
import { something } from "@/components/mot/routes/...";  // in libs/ui

// ❌ Cross-role import
import { SomeMotComponent } from "@/components/mot/...";  // in operator code

// ❌ Direct primitive import from app (bypass pattern)
import { Table, TableBody } from "@busmate/ui";  // when DataTable pattern exists

// ❌ Old import paths
import { Button } from "@/components/ui/button";  // should be @busmate/ui
```

### Recommended Import Style

```tsx
// Pattern and primitive imports
import {
  DataTable, FilterBar, FilterSelect,
  StatsCardGrid, StatsCard, StatusBadge,
  ConfirmDialog, EmptyState, useDataTable, useDialog,
  type ColumnDef,
} from "@busmate/ui";

// API client imports
import { type Route, RoutesService } from "@busmate/api-client-route";

// Local feature imports
import { routeColumns } from "./routes-columns";
import { RoutesRowActions } from "./routes-row-actions";
```

---

## 6. Anti-Patterns

### Anti-Pattern 1: Prop Drilling > 2 Levels

**Problem**: Passing props through multiple component layers.

```tsx
// ❌ Bad
<Page onDelete={handleDelete}>
  <Table onDelete={onDelete}>
    <Row onDelete={onDelete}>
      <Actions onDelete={onDelete} />
```

**Solution**: Use callbacks at the feature component level, or context for deep trees.

---

### Anti-Pattern 2: Copy-Paste Components

**Problem**: Copying a component from one feature to another instead of extracting a shared pattern.

**Detection**: If you find yourself copying a component file and changing < 30% of it, extract a shared pattern.

---

### Anti-Pattern 3: Monolithic Pages

**Problem**: Page files with > 100 lines, multiple `useState` calls, inline JSX.

**Rule**: Pages are orchestrators. Max ~100 lines. State and rendering belong in feature components.

---

### Anti-Pattern 4: Inline Styles for Theming

**Problem**: Using `style={}` or Tailwind arbitrary values for colors.

```tsx
// ❌ Bad
<div style={{ backgroundColor: "#f0f0f0" }} />
<div className="bg-[#f0f0f0]" />

// ✅ Good
<div className="bg-muted" />
```

---

### Anti-Pattern 5: Duplicate State Management

**Problem**: Multiple components managing the same state independently.

**Solution**: Lift state to the nearest common ancestor. Use `useDataTable` for table state, `useDialog` for dialog state.

---

### Anti-Pattern 6: Feature Logic in Patterns

**Problem**: Adding bus-stop-specific or route-specific logic to a pattern in `libs/ui/`.

```tsx
// ❌ Bad — domain logic in pattern
function DataTable({ data }) {
  // Pattern should not know about bus stops
  const filteredStops = data.filter(d => d.stopType === "TERMINAL");
}

// ✅ Good — domain logic in feature component
function BusStopsTable({ busStops }) {
  const terminalStops = busStops.filter(d => d.stopType === "TERMINAL");
  return <DataTable data={terminalStops} ... />;
}
```

---

## 7. File Naming & Organization

### Naming Convention

| Type | Convention | Example |
|------|-----------|---------|
| Component file | `kebab-case.tsx` | `bus-stops-table.tsx` |
| Hook file | `use-{name}.ts` | `use-data-table.ts` |
| Type file | `types.ts` or `{name}.types.ts` | `types.ts` |
| Barrel export | `index.ts` | `index.ts` |
| Config file | `{name}.ts` | `navigation.ts` |
| Test file | `{name}.test.tsx` | `bus-stops-table.test.tsx` |
| CSS file | `{name}.css` | `globals.css` |

### Directory Structure Convention

```
src/components/{role}/{feature}/
  {feature}-table.tsx           ← Main table component
  {feature}-columns.tsx         ← Column definitions
  {feature}-filter-bar.tsx      ← Filter configuration
  {feature}-stats-cards.tsx     ← KPI cards
  {feature}-form.tsx            ← Create/edit form
  {feature}-row-actions.tsx     ← Row action buttons
  {feature}-detail.tsx          ← Detail view (if exists)
  index.ts                      ← Barrel export
```

### Feature Component Naming

| Suffix | Purpose | Example |
|--------|---------|---------|
| `Table` | Data table with columns | `RoutesTable` |
| `FilterBar` | Search + filter controls | `RoutesFilterBar` |
| `StatsCards` | KPI cards for the feature | `RoutesStatsCards` |
| `Form` | Create/edit form | `RouteForm` |
| `RowActions` | Action buttons per row | `RoutesRowActions` |
| `Detail` | Entity detail view | `RouteDetail` |
| `Dialog` | Feature-specific dialog | `CreateRouteDialog` |

---

## 8. Token Management

### Adding a New Token

1. Define in `libs/ui/src/styles/globals.css` under `:root`
2. Add dark mode value under `.dark`
3. Register in `@theme` directive if a Tailwind utility is needed
4. Document the token's purpose in this file

### Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Base surfaces | `--background`, `--foreground` | `--background: 0 0% 100%` |
| Component surfaces | `--card`, `--popover`, `--sidebar` | `--sidebar: 222 47% 11%` |
| Semantic colors | `--primary`, `--destructive`, etc. | `--primary: 221 83% 53%` |
| Chart colors | `--chart-{n}` | `--chart-1: 221 83% 53%` |
| Layout | `--radius`, widths | `--radius: 0.5rem` |

### Token Naming Rule

- Tokens describe **purpose**, not appearance
- `--primary` not `--blue`
- `--destructive` not `--red`
- `--sidebar-active` not `--sidebar-blue`

---

## 9. Dependency Management

### Radix UI Packages

All Radix primitives should be consumed via shadcn/ui generated components — never import Radix directly in feature code.

```tsx
// ❌ Direct Radix import
import * as Dialog from "@radix-ui/react-dialog";

// ✅ Via shadcn component
import { Dialog, DialogContent, ... } from "@busmate/ui";
```

### Updating shadcn Components

To update a shadcn component to the latest version:

```bash
pnpm dlx shadcn@latest add {component} --cwd libs/ui --path src/components --overwrite
```

Review the diff before committing. If customizations were made, merge carefully.

### New Library Proposals

Before adding a new UI dependency:

1. **Check if shadcn/ui has it** — many patterns are covered
2. **Check bundle size** — use [bundlephobia.com](https://bundlephobia.com)
3. **Check maintenance** — is it actively maintained?
4. **Check accessibility** — does it follow WAI-ARIA?
5. **Get team agreement** — don't add dependencies unilaterally

### Current Approved Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| `@radix-ui/*` | Headless primitives (via shadcn) | ✅ Approved |
| `lucide-react` | Icons | ✅ Approved |
| `class-variance-authority` | Component variants | ✅ Approved |
| `clsx` + `tailwind-merge` | Class utility | ✅ Approved |
| `react-hook-form` + `zod` | Forms | ✅ Approved |
| `date-fns` | Date utilities | ✅ Approved |
| `next-themes` | Theme switching | ✅ Approved |
| `sonner` | Toast notifications | ✅ Approved |
| `embla-carousel` | Carousel | ✅ Approved |
| `vaul` | Drawer | ✅ Approved |
| `@dnd-kit/*` | Drag and drop | ✅ Approved |
| `ag-grid-react` | Advanced data grid (complex tables only) | ✅ Approved (special use) |
| `chart.js` + `recharts` | Data visualization | ✅ Approved |

---

## 10. Scaling for New Modules

### Adding a New Role Portal

If a new role (e.g., "Inspector") is added:

1. **Navigation config**: Add `inspectorNavigation` to `src/config/navigation.ts`
2. **Layout**: Create `src/components/layouts/inspector-layout-client.tsx` using `AppShell` + `Sidebar`
3. **App routes**: Create `src/app/inspector/layout.tsx` and `src/app/inspector/dashboard/page.tsx`
4. **ROLE_CONFIG**: Add inspector to role config mapping
5. **Feature modules**: Create `src/components/inspector/{feature}/` directories

The shared UI library (`libs/ui/`) requires **zero changes** for a new role.

### Adding a New Feature Module

1. Create directory: `src/components/{role}/{feature}/`
2. Create feature components using pattern composition template (see doc 06)
3. Create page: `src/app/{role}/{feature}/page.tsx`
4. Add navigation item to role config
5. Follow naming conventions from Section 7

### Adding a New Pattern to libs/ui

1. Check the decision tree (Section 2)
2. Create in `libs/ui/src/patterns/{pattern-name}/`
3. Export from barrel
4. Document usage
5. Add example in Storybook (if/when added)

---

## 11. Performance Guidelines

### Component Rendering

```tsx
// ✅ Memoize expensive computations
const sortedData = useMemo(() => 
  data.sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// ✅ Stable callback references
const handleDelete = useCallback((id: string) => {
  setDeleteTargetId(id);
  deleteDialog.open();
}, [deleteDialog]);

// ✅ Memoize row actions to prevent re-renders
const rowActions = useCallback((row: Route) => (
  <RouteRowActions route={row} onDelete={handleDelete} />
), [handleDelete]);
```

### Bundle Size

- Use tree-shakeable imports: `import { Button } from "@busmate/ui"` (barrel must re-export correctly)
- Lazy-load heavy components: `const MapView = dynamic(() => import("./map-view"), { ssr: false })`
- Avoid importing entire libraries: `import { format } from "date-fns"` not `import * as dateFns`

### Table Performance

- For tables with < 500 rows: Use `DataTable` from `@busmate/ui`
- For tables with 500+ rows: Use AG Grid with virtual scrolling
- Never render 1000+ table rows without virtualization

### Image Optimization

- Always use `next/image` for static images
- Set explicit `width` and `height` to prevent layout shift
- Use `loading="lazy"` for below-the-fold images

---

## 12. Documentation Standards

### Component Documentation

Every pattern in `libs/ui/` should have a JSDoc header:

```tsx
/**
 * DataTable — Renders a sortable, paginated data table with optional row selection.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   totalItems={100}
 *   page={1}
 *   pageSize={10}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   getRowId={(row) => row.id}
 * />
 * ```
 *
 * @see 06-feature-ui-patterns.md for detailed usage patterns
 */
export function DataTable<TData>({ ... }: DataTableProps<TData>) {
```

### Change Log

Maintain a changelog for significant `libs/ui/` changes:

```markdown
<!-- libs/ui/CHANGELOG.md -->

## [0.2.0] - 2025-XX-XX
### Added
- FileUpload pattern component
- DateRangePicker pattern component

### Changed
- DataTable: Added `onRowDoubleClick` prop
- StatusBadge: Added "suspended" status type

### Deprecated
- StatsCard `subtitle` prop → use `description` instead
```

### Design Decision Records

For significant design decisions, create a brief decision record:

```markdown
<!-- docs/ui/decisions/001-ag-grid-vs-custom-table.md -->

# ADR-001: AG Grid vs Custom DataTable

## Context
We need data tables for 15+ features.

## Decision
Use custom DataTable (shadcn-based) for standard tables (< 500 rows).
Keep AG Grid for Route Workspace and Schedule Workspace (complex editing, 500+ rows).

## Consequences
- Two table implementations to maintain
- But AG Grid only used in 2 places
- Custom DataTable is 10x lighter
```

---

## Summary: The 12 Commandments

1. **Import from `@busmate/ui`** — never copy pattern code into features
2. **Use semantic tokens** — never hardcode colors
3. **Compose, don't duplicate** — check existing patterns before creating new ones
4. **Pages are orchestrators** — max ~100 lines, delegate to feature components
5. **Feature components are thin wrappers** — configuration over custom logic
6. **Dark mode parity** — test every change in both themes
7. **Accessibility first** — keyboard nav, ARIA, contrast ratios
8. **Mobile first** — responsive by default
9. **One concern per component** — separation of concerns
10. **Backward compatible changes** — deprecate before removing
11. **Consistent naming** — kebab-case files, PascalCase components
12. **Document decisions** — ADRs for significant choices

---

## Document Index

| # | Document | Status |
|---|----------|--------|
| 01 | [UI Refactoring Strategy](./01-ui-refactoring-strategy.md) | Complete |
| 02 | [Design System Architecture](./02-design-system-architecture.md) | Complete |
| 03 | [shadcn/ui Integration Plan](./03-shadcn-integration-plan.md) | Complete |
| 04 | [UI Component Architecture](./04-ui-component-architecture.md) | Complete |
| 05 | [Layout and Navigation Architecture](./05-layout-and-navigation-architecture.md) | Complete |
| 06 | [Feature UI Patterns](./06-feature-ui-patterns.md) | Complete |
| 07 | [Theming and Branding](./07-theming-and-branding.md) | Complete |
| 08 | [Step-by-Step Refactoring Roadmap](./08-step-by-step-refactoring-roadmap.md) | Complete |
| 09 | [Long-Term UI Maintenance Guidelines](./09-long-term-ui-maintenance-guidelines.md) | Complete |
