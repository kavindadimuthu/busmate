# 06 — Feature UI Patterns

> **Scope**: Defines the reusable UI patterns used across all BusMate feature modules — data tables, filter bars, CRUD forms, dialogs, status badges, analytics cards, and activity logs.
> **Goal**: Establish a pattern catalog that ensures UI consistency and eliminates duplication across all 4 role-based portals.

---

## Table of Contents

1. [Pattern Catalog Overview](#1-pattern-catalog-overview)
2. [DataTable Pattern](#2-datatable-pattern)
3. [SearchFilterBar Pattern](#3-searchfilterbar-pattern)
4. [CRUD Form Pattern](#4-crud-form-pattern)
5. [Dialog & Modal Pattern](#5-dialog--modal-pattern)
6. [StatusBadge Pattern](#6-statusbadge-pattern)
7. [StatsCard Pattern](#7-statscard-pattern)
8. [Empty State Pattern](#8-empty-state-pattern)
9. [Activity Log Pattern](#9-activity-log-pattern)
10. [Dashboard Grid Pattern](#10-dashboard-grid-pattern)
11. [Map Integration Pattern](#11-map-integration-pattern)
12. [Pattern Composition Rules](#12-pattern-composition-rules)

---

## 1. Pattern Catalog Overview

Each pattern is a **composable building block** — not a monolithic component. Patterns provide structure and behavior; feature components compose them with domain data.

### Pattern Hierarchy

```
Pattern (generic structure)
  └── Feature Component (domain-specific composition)
        └── Page (assembles feature components into a view)
```

### Feature Modules and Their Patterns

| Feature Module | DataTable | FilterBar | Form | Dialog | StatusBadge | StatsCards | Map |
|----------------|:---------:|:---------:|:----:|:------:|:-----------:|:----------:|:---:|
| Bus Stops      |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     | ✅  |
| Routes         |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     | ✅  |
| Schedules      |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     |     |
| Trips          |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     | ✅  |
| Operators      |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     |     |
| Staff          |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     |     |
| Permits        |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     |     |
| Fleet          |     ✅    |     ✅    |  ✅  |   ✅   |     ✅      |     ✅     |     |
| Dashboard      |           |           |      |        |             |     ✅     |     |
| Analytics      |           |           |      |        |             |     ✅     |     |

---

## 2. DataTable Pattern

### 2.1 Architecture

The DataTable is the most complex reusable pattern. It replaces the current 325-line `DataTable.tsx` and multiple AG Grid usages.

```
DataTable (libs/ui)
├── useDataTable hook (state management)
├── DataTableHeader (column headers, sorting)
├── DataTableBody (rows, loading, empty)
├── DataTableRow (individual row)
├── DataTableCell (cell variants)
├── DataTablePagination (unified pagination)
└── DataTableToolbar (bulk actions, column visibility)
```

### 2.2 DataTable Hook

```typescript
// libs/ui/src/patterns/data-table/use-data-table.ts

import { useState, useCallback, useMemo } from "react";

export interface DataTableState<TFilter = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filters: TFilter;
  selectedRows: Set<string>;
  searchQuery: string;
}

export interface UseDataTableOptions<TFilter = Record<string, unknown>> {
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: { column: string; direction: "asc" | "desc" };
  initialFilters?: TFilter;
}

export function useDataTable<TFilter = Record<string, unknown>>(
  options: UseDataTableOptions<TFilter> = {}
) {
  const [state, setState] = useState<DataTableState<TFilter>>({
    page: options.initialPage ?? 1,
    pageSize: options.initialPageSize ?? 10,
    sortColumn: options.initialSort?.column ?? null,
    sortDirection: options.initialSort?.direction ?? "asc",
    filters: options.initialFilters ?? ({} as TFilter),
    selectedRows: new Set(),
    searchQuery: "",
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setSort = useCallback((column: string) => {
    setState((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const setFilters = useCallback((filters: Partial<TFilter>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {} as TFilter,
      searchQuery: "",
      page: 1,
    }));
  }, []);

  const setSearch = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query, page: 1 }));
  }, []);

  const toggleRow = useCallback((id: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedRows);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selectedRows: next };
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setState((prev) => {
      const allSelected = ids.every((id) => prev.selectedRows.has(id));
      return {
        ...prev,
        selectedRows: allSelected ? new Set() : new Set(ids),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRows: new Set() }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(state.filters as Record<string, unknown>).some(
      (v) => v !== undefined && v !== null && v !== ""
    ) || state.searchQuery !== "";
  }, [state.filters, state.searchQuery]);

  return {
    state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    clearFilters,
    setSearch,
    toggleRow,
    toggleAll,
    clearSelection,
    hasActiveFilters,
  };
}
```

### 2.3 Column Definition

```typescript
// libs/ui/src/patterns/data-table/types.ts

export interface ColumnDef<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => unknown;
  cell?: (props: { row: TData; value: unknown }) => React.ReactNode;
  sortable?: boolean;
  /** Hide on screens smaller than this breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Column width (Tailwind class) */
  width?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  selectedRows?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
  getRowId: (row: TData) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowActions?: (row: TData) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  bulkActions?: React.ReactNode;
}
```

### 2.4 DataTable Component

```tsx
// libs/ui/src/patterns/data-table/data-table.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/table";
import { Checkbox } from "@/components/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { DataTablePagination } from "./data-table-pagination";
import type { ColumnDef, DataTableProps } from "./types";

const hideBelowMap = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<TData>({
  columns,
  data,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  selectedRows,
  onToggleRow,
  onToggleAll,
  getRowId,
  loading = false,
  emptyState,
  rowActions,
  onRowClick,
  bulkActions,
}: DataTableProps<TData>) {
  const selectable = !!onToggleRow;
  const allIds = data.map(getRowId);
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedRows?.has(id));

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectable && selectedRows && selectedRows.size > 0 && bulkActions && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          {bulkActions}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => onToggleAll?.(allIds)}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.hideBelow && hideBelowMap[col.hideBelow],
                    col.width,
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.sortable && "cursor-pointer select-none"
                  )}
                  onClick={col.sortable ? () => onSort?.(col.id) : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && (
                      sortColumn === col.id ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-20 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="h-32 text-center"
                >
                  {emptyState ?? (
                    <span className="text-muted-foreground">No results found</span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      selectedRows?.has(id) && "bg-muted/30",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows?.has(id)}
                          onCheckedChange={() => onToggleRow?.(id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => {
                      const value = col.accessorFn
                        ? col.accessorFn(row)
                        : col.accessorKey
                        ? row[col.accessorKey]
                        : undefined;
                      return (
                        <TableCell
                          key={col.id}
                          className={cn(
                            col.hideBelow && hideBelowMap[col.hideBelow],
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right"
                          )}
                        >
                          {col.cell ? col.cell({ row, value }) : String(value ?? "")}
                        </TableCell>
                      );
                    })}
                    {rowActions && (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
```

### 2.5 Feature DataTable Example (Routes)

```tsx
// apps/frontend/management-portal/src/components/mot/routes/routes-table.tsx

"use client";

import { DataTable, type ColumnDef } from "@busmate/ui";
import { StatusBadge } from "@busmate/ui";
import { RowActions } from "./routes-row-actions";
import type { Route } from "@busmate/api-client-route";

const columns: ColumnDef<Route>[] = [
  {
    id: "routeNumber",
    header: "Route No.",
    accessorKey: "routeNumber",
    sortable: true,
    width: "w-24",
    cell: ({ value }) => <span className="font-mono font-medium">{String(value)}</span>,
  },
  {
    id: "name",
    header: "Route Name",
    accessorKey: "routeName",
    sortable: true,
  },
  {
    id: "origin",
    header: "Origin",
    accessorKey: "origin",
    hideBelow: "md",
  },
  {
    id: "destination",
    header: "Destination",
    accessorKey: "destination",
    hideBelow: "md",
  },
  {
    id: "distance",
    header: "Distance",
    accessorFn: (row) => row.totalDistance,
    hideBelow: "lg",
    cell: ({ value }) => <span>{Number(value).toFixed(1)} km</span>,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: ({ value }) => <StatusBadge status={String(value)} />,
  },
];

interface RoutesTableProps {
  routes: Route[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onView: (route: Route) => void;
  onEdit: (route: Route) => void;
  onDelete: (route: Route) => void;
}

export function RoutesTable({
  routes, totalItems, page, pageSize,
  onPageChange, onPageSizeChange,
  sortColumn, sortDirection, onSort,
  onView, onEdit, onDelete,
}: RoutesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={routes}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(r) => r.routeId ?? ""}
      onRowClick={onView}
      rowActions={(row) => (
        <RowActions onView={() => onView(row)} onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
      )}
    />
  );
}
```

---

## 3. SearchFilterBar Pattern

### 3.1 Architecture

Replaces the 626-line `SearchFilterBar.tsx`. Splits into composable parts:

```
FilterBar
├── SearchInput (debounced text search)
├── FilterSelect (dropdown filter)
├── FilterDateRange (date range picker)
├── FilterChips (active filters display)
└── FilterSheet (mobile: all filters in sheet)
```

### 3.2 FilterBar Component

```tsx
// libs/ui/src/patterns/filter-bar/filter-bar.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;        // Filter select/date components
  activeFilterCount?: number;
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  activeFilterCount = 0,
  onClearAll,
  className,
}: FilterBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Desktop: inline filters */}
        {isDesktop && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}

        {/* Mobile: filter sheet */}
        {!isDesktop && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">{children}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && onClearAll && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" /> Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 3.3 FilterSelect Component

```tsx
// libs/ui/src/patterns/filter-bar/filter-select.tsx

"use client";

import * as React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/select";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-40"}>
        <SelectValue placeholder={placeholder ?? label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 4. CRUD Form Pattern

### 4.1 Form Architecture

All forms use `react-hook-form` + `zod` validation.

```
Form Pattern
├── FormSection (card-based section with title)
├── FormField (label + input + error)
├── FormGrid (2-column responsive grid)
└── FormActions (cancel/submit buttons, sticky footer)
```

### 4.2 Generic Form Wrapper

```tsx
// libs/ui/src/patterns/form/form-wrapper.tsx

"use client";

import * as React from "react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";
import { Button } from "@/components/button";
import { Loader2 } from "lucide-react";

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  className,
}: FormWrapperProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-6 max-w-3xl">
          {children}
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-background border-t mt-8 -mx-6 px-6 py-4 flex items-center justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

### 4.3 FormSection & FormGrid

```tsx
// libs/ui/src/patterns/form/form-section.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// libs/ui/src/patterns/form/form-grid.tsx

import { cn } from "@/lib/utils";

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 4.4 Feature Form Example (Bus Stop)

```tsx
// apps/frontend/management-portal/src/components/mot/bus-stops/bus-stop-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormWrapper, FormSection, FormGrid } from "@busmate/ui";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@busmate/ui";
import { Input } from "@busmate/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@busmate/ui";
import type { BusStop } from "@busmate/api-client-route";

const busStopSchema = z.object({
  stopName: z.string().min(1, "Stop name is required"),
  stopCode: z.string().min(1, "Stop code is required"),
  latitude: z.coerce.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.coerce.number().min(-180).max(180, "Invalid longitude"),
  roadName: z.string().optional(),
  district: z.string().optional(),
  stopType: z.enum(["REGULAR", "TERMINAL", "EXPRESS"]),
});

type BusStopFormData = z.infer<typeof busStopSchema>;

interface BusStopFormProps {
  initialData?: BusStop;
  onSubmit: (data: BusStopFormData) => Promise<void>;
  onCancel: () => void;
}

export function BusStopForm({ initialData, onSubmit, onCancel }: BusStopFormProps) {
  const form = useForm<BusStopFormData>({
    resolver: zodResolver(busStopSchema),
    defaultValues: {
      stopName: initialData?.stopName ?? "",
      stopCode: initialData?.stopCode ?? "",
      latitude: initialData?.latitude ?? 0,
      longitude: initialData?.longitude ?? 0,
      roadName: initialData?.roadName ?? "",
      district: initialData?.district ?? "",
      stopType: (initialData?.stopType as BusStopFormData["stopType"]) ?? "REGULAR",
    },
  });

  return (
    <FormWrapper
      form={form}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel={initialData ? "Update Stop" : "Create Stop"}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormSection title="Basic Information" description="General details about this bus stop.">
        <FormGrid>
          <FormField
            control={form.control}
            name="stopName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Colombo Fort" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stopCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. COL-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stopType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="TERMINAL">Terminal</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Location" description="GPS coordinates and address reference.">
        <FormGrid>
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roadName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Road Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Galle Road" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Colombo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </FormSection>
    </FormWrapper>
  );
}
```

---

## 5. Dialog & Modal Pattern

### 5.1 Unified ConfirmDialog

Replaces 8+ duplicate confirmation/delete modals across the codebase.

```tsx
// libs/ui/src/patterns/dialogs/confirm-dialog.tsx

"use client";

import * as React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/alert-dialog";
import { buttonVariants } from "@/components/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "default" | "destructive" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const variantMap: Record<DialogVariant, string> = {
  default: "",
  destructive: buttonVariants({ variant: "destructive" }),
  warning: "bg-amber-500 text-white hover:bg-amber-600",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(variantMap[variant])}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 5.2 FormDialog Pattern

For dialogs that contain forms (add, edit):

```tsx
// libs/ui/src/patterns/dialogs/form-dialog.tsx

"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/dialog";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeMap[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### 5.3 useDialog Hook

Simplifies dialog state management:

```tsx
// libs/ui/src/patterns/dialogs/use-dialog.ts

import { useState, useCallback } from "react";

export function useDialog<TData = undefined>() {
  const [state, setState] = useState<{
    open: boolean;
    data?: TData;
  }>({ open: false });

  const open = useCallback((data?: TData) => {
    setState({ open: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, data: undefined });
  }, []);

  const setOpen = useCallback((open: boolean) => {
    if (!open) close();
    else setState((prev) => ({ ...prev, open }));
  }, [close]);

  return {
    isOpen: state.open,
    data: state.data,
    open,
    close,
    setOpen,
  };
}
```

Usage:

```tsx
const deleteDialog = useDialog<Route>();

// Open: deleteDialog.open(selectedRoute)
// Close: deleteDialog.close()
// Access: deleteDialog.data?.routeNumber
// Bind: <ConfirmDialog open={deleteDialog.isOpen} onOpenChange={deleteDialog.setOpen} ... />
```

---

## 6. StatusBadge Pattern

### 6.1 StatusBadge Component

```tsx
// libs/ui/src/patterns/status-badge/status-badge.tsx

import { Badge, type BadgeProps } from "@/components/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "active" | "inactive" | "pending" | "approved" | "rejected"
  | "completed" | "cancelled" | "expired" | "draft" | "in-progress"
  | "warning" | "error" | "info";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active:      { label: "Active",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  inactive:    { label: "Inactive",    className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
  pending:     { label: "Pending",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  approved:    { label: "Approved",    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  rejected:    { label: "Rejected",    className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  completed:   { label: "Completed",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  cancelled:   { label: "Cancelled",   className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" },
  expired:     { label: "Expired",     className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  draft:       { label: "Draft",       className: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  warning:     { label: "Warning",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  error:       { label: "Error",       className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  info:        { label: "Info",        className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, "-") as StatusType;
  const config = statusConfig[normalized] ?? statusConfig.info;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0",
        config.className,
        className
      )}
    >
      {dot && (
        <span
          className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
            "bg-emerald-500": normalized === "active" || normalized === "completed",
            "bg-gray-400": normalized === "inactive" || normalized === "cancelled",
            "bg-amber-500": normalized === "pending" || normalized === "warning",
            "bg-blue-500": normalized === "approved" || normalized === "in-progress" || normalized === "info",
            "bg-red-500": normalized === "rejected" || normalized === "error",
            "bg-orange-500": normalized === "expired",
            "bg-slate-400": normalized === "draft",
          })}
        />
      )}
      {label ?? config.label}
    </Badge>
  );
}
```

---

## 7. StatsCard Pattern

### 7.1 StatsCard Component

```tsx
// libs/ui/src/patterns/stats-card/stats-card.tsx

import { Card, CardContent } from "@/components/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, description, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.direction === "up" && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                {trend.direction === "down" && <ArrowDown className="h-3 w-3 text-red-500" />}
                {trend.direction === "neutral" && <Minus className="h-3 w-3 text-gray-400" />}
                <span className={cn(
                  trend.direction === "up" && "text-emerald-600",
                  trend.direction === "down" && "text-red-600",
                  trend.direction === "neutral" && "text-gray-500"
                )}>
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7.2 StatsCardGrid

```tsx
// libs/ui/src/patterns/stats-card/stats-card-grid.tsx

import { cn } from "@/lib/utils";

interface StatsCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsCardGrid({ children, className }: StatsCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {children}
    </div>
  );
}
```

---

## 8. Empty State Pattern

```tsx
// libs/ui/src/patterns/empty-state/empty-state.tsx

import { cn } from "@/lib/utils";
import { Button } from "@/components/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && (
        <div className="mb-4 p-3 rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## 9. Activity Log Pattern

Used in dashboards and detail views (e.g., recent activity, trip status updates):

```tsx
// libs/ui/src/patterns/activity-log/activity-log.tsx

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
}

interface ActivityLogProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityLog({ items, className }: ActivityLogProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {item.icon ?? (
                <div className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            {i < items.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 pt-1">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {item.actor && <span>{item.actor}</span>}
              {item.actor && <span>·</span>}
              <time>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 10. Dashboard Grid Pattern

```tsx
// libs/ui/src/patterns/dashboard/dashboard-grid.tsx

import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CSS Grid-based dashboard layout.
 * Children should use `col-span-*` and `row-span-*` classes.
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6", className)}>
      {children}
    </div>
  );
}

// Usage:
// <DashboardGrid>
//   <div className="lg:col-span-8">  {/* Chart */} </div>
//   <div className="lg:col-span-4">  {/* Sidebar */} </div>
//   <div className="lg:col-span-6">  {/* Left panel */} </div>
//   <div className="lg:col-span-6">  {/* Right panel */} </div>
// </DashboardGrid>
```

---

## 11. Map Integration Pattern

```tsx
// libs/ui/src/patterns/map/map-container.tsx

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";

interface MapContainerProps {
  title?: string;
  children: React.ReactNode;
  height?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function MapContainer({
  title,
  children,
  height = "h-[400px]",
  actions,
  className,
}: MapContainerProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn("p-0", !title && "pt-0")}>
        <div className={cn("w-full", height)}>{children}</div>
      </CardContent>
    </Card>
  );
}
```

---

## 12. Pattern Composition Rules

### Rule 1: Patterns Never Fetch Data

```tsx
// ✅ Correct — data passed in
<RoutesTable routes={data} onDelete={handleDelete} />

// ❌ Wrong — pattern fetching its own data
function RoutesTable() {
  const { data } = useFetch("/api/routes"); // Never do this in a pattern
}
```

### Rule 2: Events Flow Up, Data Flows Down

```tsx
// Page → Feature Component → Pattern
<BusStopsPage>
  <BusStopsFilterBar filters={state.filters} onFilterChange={setFilters} />
  <BusStopsTable
    data={busStops}
    onView={handleView}
    onEdit={handleEdit}
    onDelete={openDeleteDialog}
  />
</BusStopsPage>
```

### Rule 3: One Pattern Per Concern

```tsx
// ✅ Each concern is a separate pattern
<FilterBar ... />
<DataTable ... />
<DataTablePagination ... />

// ❌ One mega-component handling everything
<DataTableWithFiltersAndPagination ... />
```

### Rule 4: Compose Patterns in Feature Components

Feature components compose patterns and add domain-specific logic:

```tsx
// Feature component for bus stops list
export function BusStopsListView() {
  const table = useDataTable<BusStopFilters>();
  const { data, isLoading } = useBusStops(table.state);
  const deleteDialog = useDialog<BusStop>();

  return (
    <>
      <StatsCardGrid>
        <BusStopsStatsCards />
      </StatsCardGrid>

      <FilterBar
        searchValue={table.state.searchQuery}
        onSearchChange={table.setSearch}
        searchPlaceholder="Search bus stops..."
      >
        <FilterSelect label="Status" value={table.state.filters.status ?? ""} onChange={(v) => table.setFilters({ status: v })} options={statusOptions} />
        <FilterSelect label="District" value={table.state.filters.district ?? ""} onChange={(v) => table.setFilters({ district: v })} options={districtOptions} />
      </FilterBar>

      <DataTable
        columns={busStopColumns}
        data={data?.items ?? []}
        totalItems={data?.totalElements ?? 0}
        page={table.state.page}
        pageSize={table.state.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        sortColumn={table.state.sortColumn}
        sortDirection={table.state.sortDirection}
        onSort={table.setSort}
        getRowId={(r) => r.stopId ?? ""}
        loading={isLoading}
        rowActions={(row) => <BusStopRowActions busStop={row} onDelete={() => deleteDialog.open(row)} />}
        emptyState={<EmptyState icon={<MapPin className="h-6 w-6" />} title="No bus stops found" description="Try adjusting your filters or add a new bus stop." />}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Bus Stop"
        description={`Are you sure you want to delete "${deleteDialog.data?.stopName}"? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteDialog.data!.stopId!)}
      />
    </>
  );
}
```

---

## Next Steps

Proceed to **[07 — Theming and Branding](./07-theming-and-branding.md)** for the complete theming system, color palette, dark mode, and brand guidelines.
