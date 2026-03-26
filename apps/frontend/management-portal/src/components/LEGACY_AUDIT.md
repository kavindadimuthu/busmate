# Legacy Component Audit

> **Date**: March 2026  
> **Task**: B.1 — Audit Legacy Component Usage  
> **Purpose**: Identify which legacy components are still actively imported and which are safe to delete before migration to `@busmate/ui`.

---

## Status

| Task | Status | Notes |
|------|--------|-------|
| B.1 Audit | ✅ Complete | This document |
| B.2 Migrate primitive imports | ✅ Complete | All Group 1 & 2 items migrated |
| B.3 Delete orphaned files | ✅ Complete | 10 files deleted |
| B.4 ESLint ban rule | ✅ Complete | `no-restricted-imports` bans `@/components/ui/*` |

---

## Summary

| Directory | Total Files | Orphaned | Still Used |
|-----------|-------------|----------|------------|
| `components/ui/` | 25 | 4 | 21 |
| `components/shared/` | 12 | 4 | 8 |
| **Total** | **37** | **8** | **29** |

---

## components/ui/ (old local shadcn/ui copies)

> **Migration target**: All primitive components have direct 1:1 equivalents in `@busmate/ui`  
> **Status**: ✅ **B.2 complete** — all primitives migrated. `toast.tsx` / `toaster.tsx` migrated to Sonner.  
> **Exception**: `toast.tsx` / `toaster.tsx` — the library uses Sonner; migration required API change.

### Orphaned — safe to delete

- [x] `accordion.tsx` — ORPHANED (no external imports found)
- [x] `command.tsx` — ORPHANED (only internally imports `dialog.tsx` within the same folder; no component outside `components/ui/` imports it)
- [x] `drawer.tsx` — ORPHANED (no external imports found)
- [x] `radio-group.tsx` — ORPHANED (no external imports found; `@busmate/ui` exports `RadioGroup`, `RadioGroupItem`)

### Still Used — must migrate before deleting

- [x] `avatar.tsx` — ✅ MIGRATED (B.2)
  - `src/components/admin/profile/AdminProfile.tsx`
  - `src/components/mot/profile/MotProfile.tsx`
  - `src/components/timekeeper/profile/TimekeeperProfile.tsx`
  - `src/components/operator/profile/OperatorProfile.tsx`
  - **@busmate/ui equivalent**: `Avatar, AvatarImage, AvatarFallback` ✅ (direct drop-in)

- [x] `badge.tsx` — ✅ MIGRATED (B.2) — previously used by *(21 files)*
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/admin/settings/ApiSettingsPanel.tsx`
  - `src/components/admin/profile/AdminProfile.tsx`
  - `src/components/mot/profile/MotProfile.tsx`
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteStopsMap.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteStopsList.tsx`
  - `src/components/mot/routes/workspace/textual-mode/RouteTextualMode.tsx`
  - `src/components/mot/routes/workspace/RouteSubmissionModal.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/trips/TripDetailModal.tsx`
  - `src/components/timekeeper/profile/TimekeeperProfile.tsx`
  - `src/components/timekeeper/dashboard/UpcomingDepartures.tsx`
  - `src/components/timekeeper/dashboard/AssignedStopInfo.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - `src/components/operator/profile/OperatorProfile.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - `src/app/mot/routes/workspace/page.tsx`
  - **@busmate/ui equivalent**: `Badge, badgeVariants` ✅ (direct drop-in)

- [x] `button.tsx` — ✅ MIGRATED (B.2) — previously used by *(21 files)*
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/admin/settings/ApiSettingsPanel.tsx`
  - `src/components/mot/schedules/workspace/form-mode/ScheduleTabs.tsx`
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteStopsMap.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteStopsList.tsx`
  - `src/components/mot/routes/workspace/textual-mode/RouteTextualMode.tsx`
  - `src/components/mot/routes/workspace/RouteSubmissionModal.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/trips/TripDetailModal.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - `src/app/mot/routes/workspace/page.tsx`
  - `src/app/mot/trips/[tripId]/page.tsx`
  - `src/app/timekeeper/trips/page.tsx`
  - `src/app/timekeeper/attendance/page.tsx`
  - **@busmate/ui equivalent**: `Button, buttonVariants` ✅ (direct drop-in)

- [x] `card.tsx` — ✅ MIGRATED (B.2) — previously used by *(15 files)*
  - `src/components/admin/profile/AdminProfile.tsx`
  - `src/components/mot/profile/MotProfile.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/timekeeper/trips/TripStatsCards.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/profile/TimekeeperProfile.tsx`
  - `src/components/timekeeper/dashboard/UpcomingDepartures.tsx`
  - `src/components/timekeeper/dashboard/StatsCards.tsx`
  - `src/components/timekeeper/dashboard/AssignedStopInfo.tsx`
  - `src/components/timekeeper/attendance/AttendanceStatsCards.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceStatsCards.tsx`
  - `src/components/operator/profile/OperatorProfile.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - **@busmate/ui equivalent**: `Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent` ✅ (direct drop-in; note `CardAction` added — verify no API drift)

- [x] `checkbox.tsx` — ✅ MIGRATED (B.2)
  - `src/app/mot/bus-stops/export/page.tsx`
  - **@busmate/ui equivalent**: `Checkbox` ✅ (direct drop-in)

- [x] `collapsible.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - **@busmate/ui equivalent**: `Collapsible, CollapsibleTrigger, CollapsibleContent` ✅ (direct drop-in)

- [x] `dialog.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/RouteSubmissionModal.tsx`
  - **@busmate/ui equivalent**: `Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger` ✅ (direct drop-in)

- [x] `dropdown-menu.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/form-mode/RouteStopsList.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - **@busmate/ui equivalent**: `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, ...` ✅ (direct drop-in)

- [x] `input.tsx` — ✅ MIGRATED (B.2) — previously used by *(9 files)*
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/admin/settings/ApiSettingsPanel.tsx`
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - `src/app/timekeeper/trips/page.tsx`
  - `src/app/timekeeper/attendance/page.tsx`
  - **@busmate/ui equivalent**: `Input` ✅ (direct drop-in)

- [x] `label.tsx` — ✅ MIGRATED (B.2) — previously used by:
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - **@busmate/ui equivalent**: `Label` ✅ (direct drop-in)

- [x] `progress.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/RouteSubmissionModal.tsx`
  - `src/app/mot/routes/workspace/page.tsx`
  - **@busmate/ui equivalent**: `Progress` ✅ (direct drop-in)

- [x] `scroll-area.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - **@busmate/ui equivalent**: `ScrollArea, ScrollBar` ✅ (direct drop-in)

- [x] `select.tsx` — ✅ MIGRATED (B.2) — previously used by *(8 files)*
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - `src/app/mot/bus-stops/export/page.tsx`
  - **@busmate/ui equivalent**: `Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue` ✅ (direct drop-in)

- [x] `separator.tsx` — ✅ MIGRATED (B.2)
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - **@busmate/ui equivalent**: `Separator` ✅ (direct drop-in)

- [x] `switch.tsx` — ✅ MIGRATED (B.2)
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/admin/settings/ApiSettingsPanel.tsx`
  - **@busmate/ui equivalent**: `Switch` ✅ (direct drop-in)

- [x] `table.tsx` — ✅ MIGRATED (B.2) — previously used by *(7 files)*
  - `src/components/admin/settings/BackupSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/admin/settings/ApiSettingsPanel.tsx`
  - `src/components/timekeeper/trips/TripsTable.tsx`
  - `src/components/timekeeper/attendance/BusAttendanceTable.tsx`
  - `src/components/timekeeper/attendance/StaffAttendanceTable.tsx`
  - **@busmate/ui equivalent**: `Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption` ✅ (direct drop-in)

- [x] `tabs.tsx` — ✅ MIGRATED (B.2)
  - `src/app/timekeeper/attendance/page.tsx`
  - **@busmate/ui equivalent**: `Tabs, TabsList, TabsTrigger, TabsContent` ✅ (direct drop-in; note `@busmate/ui` also exports `tabsListVariants`)

- [x] `textarea.tsx` — ✅ MIGRATED (B.2) — previously used by:
  - `src/components/admin/settings/GeneralSettingsPanel.tsx`
  - `src/components/admin/settings/MaintenanceSettingsPanel.tsx`
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - **@busmate/ui equivalent**: `Textarea` ✅ (direct drop-in)

- [x] `toast.tsx` — ✅ MIGRATED (B.2) — Sonner-backed shim
  - `src/hooks/use-toast.ts` rewritten as a Sonner compatibility shim; `toast.tsx` is now orphaned.
  - **Safe to delete** (B.3)

- [x] `toaster.tsx` — ✅ MIGRATED (B.2) — re-exports from `@busmate/ui`
  - All 6 layout files now import `Toaster` directly from `@busmate/ui`.
  - `toaster.tsx` is now a stub re-export; effectively orphaned. **Safe to delete** (B.3)

- [x] `tooltip.tsx` — ✅ MIGRATED (B.2) — previously used by *(5 files)*
  - `src/components/mot/routes/workspace/form-mode/StopEditor.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteFormMode.tsx`
  - `src/components/mot/routes/workspace/form-mode/RouteStopsList.tsx`
  - `src/components/mot/routes/workspace/textual-mode/RouteTextualMode.tsx`
  - `src/app/mot/routes/workspace/page.tsx`
  - **@busmate/ui equivalent**: `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` ✅ (direct drop-in)

---

## components/shared/ (old shared pattern components)

> **Migration target**: Most have equivalents in `@busmate/ui` patterns, but several have API differences that require consuming-code adaptation. Some have no equivalent and must be evaluated for promotion to `libs/ui/`.

### Orphaned — safe to delete

- [x] `Pagination.tsx` — ORPHANED (no external imports found; superseded by `DataPagination.tsx`)
- [x] `base.ts` — ORPHANED (only appears in a JSDoc example comment within the file itself; no actual imports)
- [x] `breadcrumb.tsx` — ORPHANED (no external imports found; `@busmate/ui` exports `Breadcrumb` and sub-parts)
- [x] `googleMap.tsx` — ORPHANED (no external imports found)

### Still Used — must migrate before deleting

- [ ] `ActionButton.tsx` — STILL USED by: *(14 files)*
  - `src/components/mot/staff/StaffActionButtons.tsx`
  - `src/components/mot/location-tracking/LocationTrackingActionButtons.tsx`
  - `src/components/mot/operators/OperatorActionButtons.tsx`
  - `src/components/mot/trips/TripActionButtons.tsx`
  - `src/components/mot/bus-stops/BusStopActionButtons.tsx`
  - `src/components/mot/permits/PermitActionButtons.tsx`
  - `src/components/mot/schedules/ScheduleActionButtons.tsx`
  - `src/components/mot/buses/BusActionButtons.tsx`
  - `src/components/mot/routes/RouteActionButtons.tsx`
  - `src/components/mot/routes/route-group-view/RouteGroupActionButtons.tsx`
  - `src/components/admin/users/UserActionButtons.tsx`
  - `src/components/operator/revenue-analytics/RevenueActionButtons.tsx`
  - `src/components/operator/staff/StaffActionButtons.tsx`
  - `src/components/operator/salary-mgmt/SalaryActionButtons.tsx`
  - **Exports used**: `ActionButton`, `ActionButtonsContainer`, `OverflowMenuItem` (type)
  - **@busmate/ui equivalent**: ⚠️ NO EQUIVALENT — used across 4 roles (14 files). Candidate for promotion to `libs/ui/src/patterns/`. Keep app-local until promoted.

- [ ] `DataPagination.tsx` — STILL USED by: *(8 files)*
  - `src/app/admin/users/page.tsx`
  - `src/app/mot/staff-management/page.tsx`
  - `src/app/operator/trips/page.tsx`
  - `src/app/operator/staff-management/page.tsx`
  - `src/app/operator/passenger-service-permits/page.tsx`
  - `src/app/operator/revenue-analytics/page.tsx`
  - `src/app/operator/salary-management/page.tsx`
  - `src/components/mot/routes/RoutePagination.tsx`
  - **@busmate/ui equivalent**: ⚠️ NO DIRECT EQUIVALENT — `@busmate/ui` exports `Pagination` primitives only. Either build a `DataPagination` wrapper using those primitives or promote this component to `libs/ui/src/patterns/`.

- [ ] `DataTable.tsx` — STILL USED by: *(17 files)*
  - `src/components/mot/staff/StaffTable.tsx`
  - `src/components/mot/operators/OperatorsTable.tsx`
  - `src/components/mot/policies/PoliciesTable.tsx`
  - `src/components/mot/trips/TripsTable.tsx`
  - `src/components/mot/schedules/SchedulesTable.tsx`
  - `src/components/mot/fares/FareAmendmentsTable.tsx`
  - `src/components/mot/buses/BusesTable.tsx`
  - `src/components/mot/routes/RoutesTable.tsx`
  - `src/components/mot/notifications/NotificationsTable.tsx`
  - `src/components/mot/permits/PermitsTable.tsx`
  - `src/components/admin/users/UsersTable.tsx`
  - `src/components/operator/staff/StaffTable.tsx`
  - `src/components/operator/trips/OperatorTripsTable.tsx`
  - `src/components/operator/revenue-analytics/RevenueTicketsTable.tsx`
  - `src/components/operator/fleet/FleetTable.tsx`
  - `src/components/operator/permits/PermitsTable.tsx`
  - `src/components/operator/salary-mgmt/SalaryTable.tsx`
  - **Exports used**: `DataTable`, `DataTableColumn` (type), `SortState` (type)
  - **@busmate/ui equivalent**: ⚠️ INCOMPATIBLE API — `@busmate/ui` `DataTable` uses TanStack Table `ColumnDef<TData>` definitions vs. the local `DataTableColumn` type. All 17 consuming tables require significant API migration. Treat as a separate migration effort (Phase B.2 high-risk item).

- [ ] `ErrorBoundary.tsx` — ⚠️ KEPT LOCAL (intentional decision, B.2)
  - `src/app/mot/routes/workspace/page.tsx` (imports `ErrorBoundary` and `WorkspaceErrorFallback`)
  - **Reason**: `@busmate/ui` `ErrorBoundary` takes `fallback?: ReactNode` (static); local version takes `fallback?: (error, reset) => ReactNode` (render-prop). APIs are incompatible.
  - **Action needed**: Either adapt the local usage to a static fallback, or keep local indefinitely.

- [ ] `SearchFilterBar.tsx` — STILL USED by: *(17 files)*
  - `src/components/mot/staff/StaffAdvancedFilters.tsx`
  - `src/components/mot/operators/OperatorAdvancedFilters.tsx`
  - `src/components/mot/policies/PolicyFilters.tsx`
  - `src/components/mot/trips/TripAdvancedFilters.tsx`
  - `src/components/mot/schedules/ScheduleAdvancedFilters.tsx`
  - `src/components/mot/fares/FareAmendmentFilters.tsx`
  - `src/components/mot/routes/RouteAdvancedFilters.tsx`
  - `src/components/mot/buses/BusAdvancedFilters.tsx`
  - `src/components/mot/location-tracking/LocationTrackingAdvancedFilters.tsx`
  - `src/components/mot/permits/PermitAdvancedFilters.tsx`
  - `src/components/admin/users/UserAdvancedFilters.tsx`
  - `src/components/operator/staff/StaffAdvancedFilters.tsx`
  - `src/components/operator/trips/OperatorTripsFilters.tsx`
  - `src/components/operator/fleet/FleetFilters.tsx`
  - `src/components/operator/permits/PermitFilters.tsx`
  - `src/app/operator/revenue-analytics/page.tsx`
  - `src/app/operator/salary-management/page.tsx`
  - **Exports used**: `SearchFilterBar`, `SelectFilter`, `FilterChipDescriptor` (type), `SegmentedControl`, `SegmentOption` (type)
  - **@busmate/ui equivalent**: ⚠️ DIFFERENT API — `@busmate/ui` exports `FilterBar` and `FilterSelect`. Props/structure differ from local `SearchFilterBar`. All 17 files require adaptation.

- [ ] `StatsCard.tsx` — STILL USED by: *(21 files)*
  - `src/components/mot/staff/StaffStatsCards.tsx`
  - `src/components/mot/location-tracking/TrackingStatsCards.tsx`
  - `src/components/mot/operators/OperatorStatsCards.tsx`
  - `src/components/mot/trips/TripStatsCards.tsx`
  - `src/components/mot/fares/FareStatsCards.tsx`
  - `src/components/mot/routes/RouteStatsCards.tsx`
  - `src/components/mot/buses/BusStatsCards.tsx`
  - `src/components/mot/permits/PermitStatsCards.tsx`
  - `src/components/mot/schedules/ScheduleStatsCards.tsx`
  - `src/components/mot/analytics/AnalyticsOverview.tsx`
  - `src/components/mot/analytics/FleetAnalyticsPanel.tsx`
  - `src/components/mot/analytics/PassengerAnalyticsPanel.tsx`
  - `src/components/mot/analytics/StaffAnalyticsPanel.tsx`
  - `src/components/mot/analytics/TripAnalyticsPanel.tsx`
  - `src/components/mot/analytics/RouteAnalyticsPanel.tsx`
  - `src/components/mot/analytics/RevenueAnalyticsPanel.tsx`
  - `src/components/admin/users/UserStatsCards.tsx`
  - `src/components/operator/revenue-analytics/RevenueStatsCards.tsx`
  - `src/components/operator/trips/OperatorTripStatsCards.tsx`
  - `src/components/operator/staff/StaffStatsCards.tsx`
  - `src/components/operator/salary-mgmt/SalaryStatsCards.tsx`
  - **Exports used**: `StatsCardMetric` (type), `TrendDirection` (type), `StatsCardColor` (type)
  - **@busmate/ui equivalent**: ⚠️ DIFFERENT PROPS API — `@busmate/ui` exports `StatsCard` and `StatsCardGrid` but uses different prop interface (`StatsCardProps` with `title`, `value`, `icon`, `trend`). Local consumers use `StatsCardMetric` type array passed to `StatsCardsContainer`. All consuming files require prop adaptation.

- [ ] `StatsCardsContainer.tsx` — STILL USED by: *(same 21 files as StatsCard.tsx)*
  - (See StatsCard.tsx consumer list above — same files import both)
  - **@busmate/ui equivalent**: ✅ Replace with `StatsCardGrid` from `@busmate/ui`. Grid layout wrapper — straightforward swap after `StatsCard` migration.

- [ ] `SwitchableTabs.tsx` — STILL USED by: *(7 files)*
  - `src/components/mot/staff/StaffTypeTabs.tsx`
  - `src/components/mot/bus-stops/ViewTabs.tsx`
  - `src/components/mot/routes/route-group-view/RouteSelector.tsx`
  - `src/components/operator/staff/StaffTypeTabs.tsx`
  - `src/app/operator/revenue-analytics/page.tsx`
  - `src/app/operator/salary-management/page.tsx`
  - **Exports used**: `SwitchableTabs`, `TabItem` (type)
  - **@busmate/ui equivalent**: ⚠️ NO EQUIVALENT — `@busmate/ui` exports `Tabs` primitives only; no styled segmented/switchable tab pattern. Candidate for promotion to `libs/ui/src/patterns/` or keep app-local.

---

## Migration Priority (for Task B.2)

### Group 1 — Easy wins (direct swap, no API changes)
All `components/ui/` primitives below can be migrated by changing the import path to `@busmate/ui`:

```
avatar, badge, button, card, checkbox, collapsible, dialog,
dropdown-menu, input, label, progress, scroll-area, select,
separator, switch, table, tabs, textarea, tooltip
```

### Group 2 — Special case (API change required)
- `toast.tsx` + `toaster.tsx` → requires migration to Sonner (`toast()` from `sonner` package + `Toaster` from `@busmate/ui`)
- `src/hooks/use-toast.ts` must also be updated

### Group 3 — @busmate/ui equivalent exists but props differ (adaptation required)
- `ErrorBoundary.tsx` → use `ErrorBoundary` from `@busmate/ui` (low effort)
- `StatsCard.tsx` + `StatsCardsContainer.tsx` → use `StatsCard` + `StatsCardGrid` from `@busmate/ui` (21 files, moderate effort)

### Group 4 — No @busmate/ui equivalent (promote or keep app-local)
- `ActionButton.tsx` / `ActionButtonsContainer` → promote to `libs/ui/src/patterns/` (14 files, high value)
- `DataPagination.tsx` → promote to `libs/ui/src/patterns/` or build from `Pagination` primitives (8 files)
- `SwitchableTabs.tsx` → promote to `libs/ui/src/patterns/` (7 files)

### Group 5 — Incompatible API (complex migration, separate effort)
- `DataTable.tsx` + `SearchFilterBar.tsx` → requires comprehensive API migration affecting 17+ files each

---

## Next Steps (Task B.2 prerequisites)

Before proceeding to B.2:
1. Confirm this audit with the team
2. Start with Group 1 (easy wins) — safe to batch migrate
3. Treat Group 5 (`DataTable`, `SearchFilterBar`) as a separate migration epic — do not attempt in B.2 without targeted planning
4. Decide promotion strategy for Group 4 components before deleting them in B.3
