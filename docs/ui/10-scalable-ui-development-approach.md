# 10 — Scalable & Convenient UI Development Approach (new-react-portal)

> **Status:** Proposal / implementation plan
> **Scope:** `apps/frontend/new-react-portal` first; the layer is built inside `libs/ui` (`@busmate/ui`) so it can later serve other clients.
> **Relationship to prior docs:** This is the *next layer up* from the design system described in `02`–`06`. Those docs delivered primitives + patterns. This doc adds a **resource layer** on top of them, plus a **granularity ladder** so we keep full control while removing repeated wiring.

---

## 1. Context — where we are today

The design-system migration succeeded. `libs/ui` (`@busmate/ui`) already ships:

- **Primitives** (~35 shadcn/radix components): `Button`, `Input`, `Table`, `Dialog`, `Select`, …
- **Patterns**: `DataTable` (+ `ColumnDef`, `useDataTable`), `FilterBar` / `FilterSelect`, `StatsCard` / `StatsCardGrid`, `FormWrapper` / `FormSection` / `FormGrid`, `ConfirmDialog` / `FormDialog` / `useDialog`, `EmptyState`, `DashboardGrid`, `ActivityLog`, `Chart`.
- **Layouts**: `AppShell`, `Sidebar`, `Header`, `PageContainer`, `Section`.

These are genuinely adopted (≈221/417 `.tsx` files import from `@busmate/ui`). **The primitive/pattern level is not the problem.**

### The real duplication is one level up — per *entity*

Every managed entity (Buses, Routes, Staff, Operators, Permits, Policies, Schedules, Stops, Fares, Trips, Notifications, Tickets, …) re-implements the **same two things by hand**:

**(a) A wrapper-component set** — e.g. `src/components/mot/buses/`:
```
BusesStatsCards.tsx   BusesFilterBar.tsx   BusesColumns.tsx
BusesTable.tsx        BusActionButtons.tsx BusAdvancedFilters.tsx
BusForm.tsx           DeleteBusModal.tsx   ...
```
Each just calls `@busmate/ui` patterns with slightly different config written out longhand. ~15 entities × 5–8 files.

**(b) An orchestration hook** — e.g. `src/hooks/mot/buses/useBuses.ts` glues:
`useDataTable` state (page/sort/search/filters) + a generated API service (`BusManagementService.getAllBuses / getBusStatistics / getBusFilterOptions`) + local state (`rows`, `total`, `loading`, `stats`, `filterOptions`) + `useDialog` for delete + handlers (`handleView/Edit/DeleteConfirm/ExportAll`). **The shape is identical across entities; only the service and field names change.**

**(c) A page** — e.g. `src/pages/mot/buses/page.tsx` — wires `useSetPageMetadata` / `useSetPageActions` + the wrappers.

> **Conclusion:** We reuse *components* but copy-paste *wiring* (columns, filters, stat defs, and the hook shape). The fix is a declarative **resource layer** that generates (a) and (b) from one config, while keeping every escape hatch open.

---

## 2. Goals & non-goals

**Goals**
1. Build a new list/detail/form screen for an entity in **one small config file**, not 6–8 hand-written files.
2. **Retain full control** — any generated screen can be partially or fully overridden, down to raw JSX, without "fighting the framework."
3. **Multiple granularity levels** — pick how much you hand-build vs. generate, per screen, per section.
4. Standardize the data-orchestration hook so `useBuses`-style boilerplate stops being re-authored.
5. Keep everything **code-authored & PR-reviewed** (type-safe, testable). No runtime magic required to ship.
6. Built inside `@busmate/ui` so it is portable to other clients later.

**Non-goals (for this phase)**
- ❌ A visual drag-and-drop page builder.
- ❌ Runtime/DB-stored view definitions editable by non-engineers.
- ❌ Removing hand-written screens — they remain first-class for anything bespoke (route workspace, live tracking map, schedule editor).

> These non-goals are the **future "BusMate Studio" tier** (§9, Level 4). This plan deliberately builds the code-driven foundation whose config shape *becomes* that runtime schema later — so nothing here is throwaway.

---

## 3. Core principle — Progressive Disclosure (the granularity ladder)

The system is a **ladder**, not a framework you're locked into. Each rung trades verbosity for convenience. **You can drop down a rung at any point — for a whole screen, or for a single section of one screen.**

| Level | Name | You write | Use when | Status |
|------|------|-----------|----------|--------|
| **L0** | **Primitives** | Raw `Button`, `Input`, `Table`… | Truly bespoke UI | ✅ Exists |
| **L1** | **Patterns** | Compose `DataTable`, `FilterBar`, `StatsCardGrid`, `FormWrapper` by hand | Non-standard layouts that still want our components | ✅ Exists |
| **L2** | **Blocks (composed sections)** | `<ResourceStats>`, `<ResourceFilters>`, `<ResourceTable>` — each takes config **or** children | You want the standard section but custom arrangement / extra sections | 🔨 Build |
| **L3** | **Screens (config-driven)** | `defineResource(...)` + `<ResourceListView resource={x} />` | The ~80% CRUD screens: list + filter + stats + form + detail | 🔨 Build |
| **L4** | **Studio (runtime registry)** | Resource configs stored/served, optional visual assembly | Non-engineer view customization, tenant-specific dashboards | 🔮 Future |

**The rule:** default to L3. When L3 can't express something, drop to L2 for *that section only* (pass a render prop or children). When even L2 is wrong, drop to L1/L0 for that screen. **You never lose control — you choose the altitude.**

---

## 4. Architecture — the "resource" model

A **resource** = one managed entity + how to list / filter / summarize / create / edit / view it. It is described **once** and consumed by both the data layer and the view layer.

```
                 ┌────────────────────────────────────────┐
                 │  defineResource(config)   ← one file     │
                 │  (schema, columns, filters, stats,       │
                 │   form, actions, api bindings)           │
                 └───────────────┬────────────────────────┘
                                 │
              ┌──────────────────┴───────────────────┐
              ▼                                       ▼
   ┌────────────────────┐                 ┌────────────────────────┐
   │  DATA LAYER          │                │  VIEW LAYER              │
   │  useResource(cfg)    │                │  <ResourceListView>      │
   │  → rows,total,loading│                │  <ResourceFormView>      │
   │    stats,filterOpts, │                │  <ResourceDetailView>    │
   │    state,handlers    │  ── feeds ──▶  │  (L2 blocks inside)      │
   │  (wraps useDataTable │                │                          │
   │   + useDialog + API) │                │                          │
   └────────────────────┘                 └────────────────────────┘
```

### 4.1 Data layer — `useResource` (kills the `useBuses` boilerplate)

A factory that returns the exact controller shape today's hand-written hooks return, driven by config:

```ts
// libs/ui/src/resource/use-resource.ts
export function useResource<TRow, TFilters>(cfg: ResourceConfig<TRow, TFilters>) {
  const table  = useDataTable<TFilters>({ initialPageSize: 10, ...cfg.table });
  const dialog = useDialog<TRow>();

  const list = useAsync(() => cfg.api.list({ ...table.state }), [table.state]);
  const stats = useAsync(() => cfg.api.stats?.(), []);
  const filterOptions = useAsync(() => cfg.api.filterOptions?.(), []);

  return {
    rows: list.data?.content ?? [],
    total: list.data?.totalElements ?? 0,
    isLoading: list.loading,
    state: table.state, ...table,          // setPage/setSort/setSearch/setFilters/clearFilters
    stats: cfg.mapStats?.(stats.data) ?? stats.data,
    filterOptions: filterOptions.data,
    deleteDialog: dialog,
    handleView:  (r: TRow) => cfg.routes?.view?.(r),
    handleEdit:  (r: TRow) => cfg.routes?.edit?.(r),
    handleDeleteConfirm: async () => { await cfg.api.remove?.(dialog.data!); list.refetch(); },
    handleExportAll: () => cfg.api.exportAll?.(),
  };
}
```

> This is the biggest immediate win: `useBuses`, `useRoutes`, `useStaff`… collapse into `useResource(busesResource)`. The **generated API clients (`@busmate/api-client-core`) stay the source of truth** — the config just points at their methods.

### 4.2 View layer — L3 screens

```tsx
// ResourceListView composes the same @busmate/ui patterns, from config
export function ResourceListView<T, F>({ resource, ...overrides }: ResourceListViewProps<T, F>) {
  const c = useResource(resource);
  return (
    <div className="space-y-6">
      <ResourceStats   resource={resource} data={c.stats} />
      <ResourceFilters resource={resource} controller={c} />
      <ResourceTable   resource={resource} controller={c} {...overrides} />
      <ConfirmDialog {...c.deleteDialog.props} onConfirm={c.handleDeleteConfirm} />
    </div>
  );
}
```

### 4.3 View layer — L2 blocks (the escape hatch that keeps control)

`ResourceStats`, `ResourceFilters`, `ResourceTable`, `ResourceForm` are exported **individually**. Each accepts config **or** `children` / `render` props. So a page can do 90% config + 10% custom:

```tsx
export default function BusesPage() {
  const c = useResource(busesResource);
  usePageChrome(busesResource);                 // metadata + action buttons from config
  return (
    <PageContainer>
      <ResourceStats resource={busesResource} data={c.stats} />
      <div className="flex gap-4">
        <ResourceFilters resource={busesResource} controller={c} />
        <LiveGpsToggle />                        {/* ← bespoke, hand-written, sits right alongside */}
      </div>
      <ResourceTable
        resource={busesResource}
        controller={c}
        columns={[...busesResource.columns, gpsStatusColumn]}   {/* per-page column override */}
      />
    </PageContainer>
  );
}
```

---

## 5. Config contracts (type shapes)

Types live in `libs/ui/src/resource/types.ts`. All optional-where-sensible so a minimal resource is tiny.

```ts
export interface ResourceConfig<TRow, TFilters> {
  name: string;                                 // "buses"
  title: string;                                // "Buses Management"

  // ── Data bindings (point at generated api-client-core services) ──
  api: {
    list: (q: ListQuery<TFilters>) => Promise<Page<TRow>>;
    stats?: () => Promise<unknown>;
    filterOptions?: () => Promise<unknown>;
    remove?: (row: TRow) => Promise<void>;
    exportAll?: () => Promise<void>;
    create?: (input: unknown) => Promise<TRow>;
    update?: (id: string, input: unknown) => Promise<TRow>;
    getOne?: (id: string) => Promise<TRow>;
  };

  columns: ColumnDef<TRow>[];                    // reuse existing @busmate/ui ColumnDef
  filters?: FilterDef<TFilters>[];              // → FilterBar/FilterSelect
  stats?: StatDef[];                            // → StatsCardGrid
  mapStats?: (raw: unknown) => StatValue[];

  form?: {                                      // → FormWrapper/FormSection/FormGrid
    schema: ZodSchema;                          // reuse existing zod schemas
    sections: { title: string; fields: FieldDef[] }[];
  };

  rowActions?: ActionDef<TRow>[];               // view/edit/delete/custom
  pageActions?: ActionDef<void>[];              // header buttons (Add/Import/Export)
  routes?: { view?: (r: TRow) => string; edit?: (r: TRow) => string; create?: string };

  table?: Partial<UseDataTableOptions<TFilters>>;
}
```

**Design rule:** these mirror what `DataTable`, `FilterBar`, `StatsCardGrid`, `FormWrapper` already accept — the config is a *thin declarative index* over existing props, so there's little new UI surface to learn or maintain.

---

## 6. Where the code lives

```
libs/ui/src/resource/            # NEW — the resource layer (portable)
  types.ts                       # ResourceConfig, ColumnDef re-export, FilterDef, StatDef…
  define-resource.ts             # defineResource() identity+validation helper
  use-resource.ts                # data controller factory
  views/
    resource-list-view.tsx       # L3
    resource-form-view.tsx       # L3
    resource-detail-view.tsx     # L3
  blocks/
    resource-stats.tsx           # L2
    resource-filters.tsx         # L2
    resource-table.tsx           # L2
    resource-form.tsx            # L2
  index.ts

apps/frontend/new-react-portal/src/
  resources/                     # NEW — one config file per entity
    mot/
      buses.resource.ts
      routes.resource.ts
      staff.resource.ts
      ...
  pages/mot/buses/page.tsx       # shrinks to ~15 lines
  hooks/mot/buses/               # DELETED once migrated (logic moves into config)
  components/mot/buses/          # only bespoke bits survive (e.g. BusSummary, map popups)
```

Export from `@busmate/ui` root: `defineResource`, `useResource`, `ResourceListView/FormView/DetailView`, `ResourceStats/Filters/Table/Form`, and all config types.

---

## 7. Concrete example — Buses, before → after

**Before:** `useBuses.ts` (~180 lines) + `BusesStatsCards/FilterBar/Columns/Table/ActionButtons/AdvancedFilters.tsx` + `page.tsx` (~110 lines).

**After — one config file:**

```ts
// src/resources/mot/buses.resource.ts
import { defineResource } from '@busmate/ui';
import { BusManagementService } from '@busmate/api-client-core';
import { busSchema } from '@/types/schemas/bus';
import { busesColumns } from './buses.columns';   // keep rich cells if desired (see note)

export const busesResource = defineResource({
  name: 'buses',
  title: 'Buses Management',
  api: {
    list: (q) => BusManagementService.getAllBuses(
      q.page - 1, q.pageSize, q.sortColumn ?? 'ntcRegistrationNumber',
      q.sortDirection, q.search, q.filters.operatorId, q.filters.status),
    stats: () => BusManagementService.getBusStatistics(),
    filterOptions: () => BusManagementService.getBusFilterOptions(),
  },
  mapStats: (r: any) => [
    { label: 'Total Buses', value: r.totalBuses },
    { label: 'Active',      value: r.activeBuses },
    { label: 'Inactive',    value: r.inactiveBuses },
    { label: 'Avg Capacity', value: r.averageCapacity },
  ],
  columns: busesColumns,
  filters: [
    { key: 'status',     type: 'select', source: 'statuses' },
    { key: 'operatorId', type: 'select', source: 'operators', labelKey: 'name', valueKey: 'id' },
    { key: 'model',      type: 'select', source: 'models' },
  ],
  form: { schema: busSchema, sections: [
    { title: 'Vehicle', fields: ['ntcRegistrationNumber', 'model', 'capacity'] },
    { title: 'Assignment', fields: ['operatorId', 'status'] },
  ]},
  pageActions: [
    { label: 'Add Bus',    action: 'navigate', to: '/mot/buses/create', variant: 'default' },
    { label: 'Import',     action: 'navigate', to: '/mot/buses/import' },
    { label: 'Export All', action: 'call', handler: 'exportAll' },
  ],
  routes: { view: (b) => `/mot/buses/${b.id}`, edit: (b) => `/mot/buses/${b.id}/edit` },
});
```

```tsx
// src/pages/mot/buses/page.tsx  — now ~12 lines
import { ResourceListView } from '@busmate/ui';
import { busesResource } from '@/resources/mot/buses.resource';
export default function BusesPage() {
  return <ResourceListView resource={busesResource} />;
}
```

> **Note on `columns`:** rich cell renderers (icons, status badges, formatted dates) stay in a small `buses.columns.tsx` — that's *legitimate per-entity UI*, not boilerplate, and lives happily at L2. The point is we stop re-authoring the *hook, filter bar, stats cards, table wiring, action buttons, and page glue*.

---

## 8. Rollout plan (phased, low-risk)

**Phase 0 — Foundations (build the layer)**
- Add `libs/ui/src/resource/` with types, `defineResource`, `useResource`, L2 blocks, L3 views.
- `useResource` must reproduce the **exact controller shape** current pages expect (so migration is mechanical).
- Storybook stories + unit tests for each block/view (matches existing `*.stories.tsx` convention).
- Add `usePageChrome(resource)` helper wrapping `useSetPageMetadata`/`useSetPageActions`.

**Phase 1 — Prove it on 2 entities**
- Migrate **Buses** (complex: stats + filters + export) and one **simple** entity (e.g. Policies or Fares).
- Keep old files until parity is confirmed (visual + behavior). Delete after.
- Write `docs/ui/11-resource-authoring-guide.md` ("how to add a new entity screen") from what we learn.

**Phase 2 — Migrate the CRUD long tail**
- Convert the remaining ~13 entities (Routes, Staff, Operators, Permits, Schedules, Stops, Trips, Notifications, Tickets, admin Users/Logs …), one PR each. Mechanical after Phase 1.
- Track: files deleted, LOC removed, time-to-add-new-screen.

**Phase 3 — Forms & details**
- Roll `ResourceFormView` / `ResourceDetailView` across create/edit/detail routes.
- Standardize the `*Form.tsx` + `Delete*Modal.tsx` sets the same way.

**Phase 4 — Harden & document**
- Lint rule / PR checklist: "new managed entity ⇒ starts as a resource config; drop to L2/L1 only with a one-line reason."
- Update `09-long-term-ui-maintenance-guidelines.md`.

**Phase 5 (future, optional) — "BusMate Studio" (Level 4)**
- Serve resource configs at runtime (registry), optional visual assembly, tenant/role-specific dashboards **without a deploy**. Only pursue if a real non-engineer-authoring need appears. The Phase-0 config shape is already the schema for this.

---

## 9. Governance & conventions

- **Default altitude is L3.** Dropping to L2/L1 is fine but should carry a one-line "why" in the PR (keeps the ladder honest).
- **Generated API clients remain the data source of truth.** Resources bind to `@busmate/api-client-core` services; no fetch logic hidden in the UI layer.
- **Zod schemas remain the validation source of truth.** `form.schema` reuses `src/types/schemas/*`.
- **Bespoke screens stay bespoke.** Route workspace, live tracking map, schedule editor, dashboards with custom viz do **not** get forced into resources.
- **One resource file per entity**, colocated under `src/resources/<role>/`.
- **No new styling system.** Everything renders through existing `@busmate/ui` tokens/patterns.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Abstraction becomes a straitjacket | The **ladder + per-section escape hatches** (L2 blocks accept children/render props); dropping down is a first-class, documented path. |
| "Generic" config balloons to encode every edge case | Cap config expressiveness deliberately; edge cases drop to L2, they don't grow the schema. Review new config keys like API changes. |
| Migration destabilizes working screens | Migrate behind parity checks, one entity per PR, old files kept until verified; start with 2 pilots. |
| Team unfamiliarity | Phase-1 authoring guide + Storybook examples + the fact that config mirrors props they already know. |
| Over-generalizing to other apps too early | Layer lives in `@busmate/ui` but **only new-react-portal consumes it** until proven; mobile/passenger-web opt in later if UI overlaps. |

## 11. Success metrics

- **Time to add a new entity CRUD screen:** days → < 1 hour.
- **Files per entity:** 6–8 → 1 config (+ optional columns file).
- **LOC deleted** across the ~15 entities (target: multi-thousand net reduction).
- **Consistency:** all list screens share filter/stat/table/pagination UX by construction.
- **Control preserved:** every migrated screen can still be customized at L2/L1 without forking the layer.
