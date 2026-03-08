# 04 — UI Component Architecture

> **Scope**: Defines the layered component architecture — from Radix primitives through shadcn base components, reusable patterns, feature components, to complete pages.
> **Goal**: Establish clear rules for which layer a component belongs to, how layers interact, and how to compose UI from bottom to top.

---

## Table of Contents

1. [Component Layers](#1-component-layers)
2. [Layer 0: Design Tokens](#2-layer-0-design-tokens)
3. [Layer 1: Primitives (Radix)](#3-layer-1-primitives-radix)
4. [Layer 2: Base Components (shadcn)](#4-layer-2-base-components-shadcn)
5. [Layer 3: Patterns](#5-layer-3-patterns)
6. [Layer 4: Feature Components](#6-layer-4-feature-components)
7. [Layer 5: Pages](#7-layer-5-pages)
8. [Component Communication](#8-component-communication)
9. [File & Naming Conventions](#9-file--naming-conventions)
10. [Component Decision Tree](#10-component-decision-tree)

---

## 1. Component Layers

```
                          DEPENDENCY DIRECTION
                          ←──────────────────

┌────────────────────────────────────────────────────────────────┐
│  Layer 5: PAGES                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /mot/routes/page.tsx                                     │  │
│  │  /mot/bus-stops/page.tsx                                  │  │
│  │  /admin/dashboard/page.tsx                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │ composes                                            │
│           ▼                                                     │
│  Layer 4: FEATURE COMPONENTS                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RoutesTable       BusStopForm      ScheduleWorkspace    │  │
│  │  OperatorKPICards  StaffDetail      TripAssignmentPanel  │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │ composes                                            │
│           ▼                                                     │
│  Layer 3: PATTERNS                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DataTable    FilterBar    StatsCard    FormField         │  │
│  │  ConfirmDialog StatusBadge PageHeader   EmptyState        │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │ composes                                            │
│           ▼                                                     │
│  Layer 2: BASE COMPONENTS (shadcn/ui)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Button   Card    Dialog   Input    Select   Table       │  │
│  │  Badge    Tabs    Checkbox Switch   Avatar   Tooltip     │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │ wraps                                               │
│           ▼                                                     │
│  Layer 1: PRIMITIVES (Radix UI)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @radix-ui/react-dialog   @radix-ui/react-dropdown-menu  │  │
│  │  @radix-ui/react-tabs     @radix-ui/react-select         │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │ styled by                                           │
│           ▼                                                     │
│  Layer 0: DESIGN TOKENS                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CSS Custom Properties: --primary, --background, etc.     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Import Rules

| Rule | Description |
|------|-------------|
| **Layers import downward only** | A layer CAN import from layers below it. A layer CANNOT import from layers above it. |
| **No skip-level imports** | Pages should use patterns and features, not raw Radix primitives. |
| **Patterns import base components** | `DataTable` uses shadcn `Table`, not `@radix-ui/react-*` directly. |
| **Feature components import patterns** | `RoutesTable` uses `DataTable`, not building a table from scratch. |
| **Domain logic is Layer 4+** | Layers 0-3 have ZERO knowledge of routes, buses, schedules, or API services. |

---

## 2. Layer 0: Design Tokens

**Location**: `libs/ui/theme/`

Tokens are CSS custom properties consumed by all layers above. See **[02 — Design System Architecture](./02-design-system-architecture.md)** for the complete token specification.

```css
/* Consumed as Tailwind utilities */
<div className="bg-primary text-primary-foreground rounded-lg shadow-sm">
```

**Key rule**: No component in any layer should use raw color values like `bg-blue-600`. All colors come from semantic tokens.

---

## 3. Layer 1: Primitives (Radix)

**Location**: `node_modules/@radix-ui/react-*`

These are **not written or modified** — they are npm dependencies providing:
- Keyboard navigation
- Focus management
- ARIA attributes
- Screen reader compatibility
- WAI-ARIA design pattern compliance

### Radix Primitives Used in BusMate

| Primitive | Used By |
|-----------|---------|
| `@radix-ui/react-dialog` | Dialog, AlertDialog, Sheet |
| `@radix-ui/react-dropdown-menu` | DropdownMenu |
| `@radix-ui/react-select` | Select |
| `@radix-ui/react-tabs` | Tabs |
| `@radix-ui/react-checkbox` | Checkbox |
| `@radix-ui/react-radio-group` | RadioGroup |
| `@radix-ui/react-switch` | Switch |
| `@radix-ui/react-avatar` | Avatar |
| `@radix-ui/react-label` | Label |
| `@radix-ui/react-popover` | Popover, DatePicker |
| `@radix-ui/react-tooltip` | Tooltip |
| `@radix-ui/react-scroll-area` | ScrollArea |
| `@radix-ui/react-separator` | Separator |
| `@radix-ui/react-accordion` | Accordion |
| `@radix-ui/react-collapsible` | Collapsible |
| `@radix-ui/react-progress` | Progress |
| `@radix-ui/react-slider` | Slider |
| `@radix-ui/react-slot` | Button (asChild pattern) |
| `@radix-ui/react-toggle` | Toggle |
| `@radix-ui/react-toggle-group` | ToggleGroup |

---

## 4. Layer 2: Base Components (shadcn)

**Location**: `libs/ui/src/components/`

These are the **shadcn-generated** components. They wrap Radix primitives with:
- Tailwind CSS design-token-based styling
- CVA (class-variance-authority) for variant management
- `cn()` utility for class merging

### Example: Button Component

```tsx
// libs/ui/src/components/button.tsx

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles — use design tokens
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:     "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:       "hover:bg-accent hover:text-accent-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
        // BUSMATE-CUSTOM: Added status variants
        success:     "bg-success text-success-foreground hover:bg-success/90",
        warning:     "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-md px-8",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Example: Badge Component

```tsx
// libs/ui/src/components/badge.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline:     "text-foreground",
        // BUSMATE-CUSTOM: Status variants
        success:     "border-transparent bg-success/10 text-success",
        warning:     "border-transparent bg-warning/10 text-warning",
        info:        "border-transparent bg-info/10 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### Complete Base Component List

| Component | Source | Key Features |
|-----------|--------|-------------|
| `accordion` | shadcn | Collapsible sections |
| `alert-dialog` | shadcn | Destructive action confirmations |
| `avatar` | shadcn | User/entity images with fallback |
| `badge` | shadcn + custom | Status indicators (7 variants) |
| `breadcrumb` | shadcn | Navigation breadcrumbs |
| `button` | shadcn + custom | Primary action trigger (8 variants, 4 sizes) |
| `calendar` | shadcn | Date picker calendar |
| `card` | shadcn | Content container with header/footer |
| `checkbox` | shadcn | Boolean toggle |
| `collapsible` | shadcn | Expandable section |
| `command` | shadcn | Command palette / combobox |
| `dialog` | shadcn | Modal dialogs |
| `dropdown-menu` | shadcn | Context/action menus |
| `form` | shadcn | Form field wrapper with validation |
| `input` | shadcn | Text input |
| `label` | shadcn | Form labels |
| `pagination` | shadcn | Page navigation |
| `popover` | shadcn | Floating content |
| `progress` | shadcn | Progress bar |
| `radio-group` | shadcn | Single-select options |
| `scroll-area` | shadcn | Custom scrollbar container |
| `select` | shadcn | Dropdown selection |
| `separator` | shadcn | Visual divider |
| `sheet` | shadcn | Slide-out panel |
| `skeleton` | shadcn | Loading placeholder |
| `slider` | shadcn | Range input |
| `sonner` | shadcn | Toast notification (modern) |
| `switch` | shadcn | Toggle switch |
| `table` | shadcn | Data table primitives |
| `tabs` | shadcn | Tabbed content |
| `textarea` | shadcn | Multi-line text input |
| `toast` | shadcn | Toast notification |
| `toaster` | shadcn | Toast viewport |
| `toggle` | shadcn | Toggle button |
| `toggle-group` | shadcn | Group of toggle buttons |
| `tooltip` | shadcn | Hover tooltip |

---

## 5. Layer 3: Patterns

**Location**: `libs/ui/src/patterns/`

Patterns combine multiple base components into reusable, domain-agnostic UI blocks. They accept data via props and emit events via callbacks.

### Pattern: DataTable

```tsx
// libs/ui/src/patterns/data-table/data-table.tsx

"use client";

import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/table";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  accessorFn?: (row: T) => React.ReactNode;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  sort?: SortState;
  onSort?: (sort: SortState) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
}

// ── Component ─────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  sort,
  onSort,
  onRowClick,
  emptyMessage = "No data found.",
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    const direction =
      sort?.column === columnKey && sort.direction === "asc" ? "desc" : "asc";
    onSort({ column: columnKey, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sort?.column !== columnKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    return sort.direction === "asc"
      ? <ChevronUp className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />;
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-card")}>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.sortable && "cursor-pointer select-none hover:text-foreground"
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon columnKey={col.key} />}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow
                key={keyExtractor(row)}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : col.accessorFn
                        ? col.accessorFn(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Pattern: StatsCard

```tsx
// libs/ui/src/patterns/stats-card/stats-card.tsx

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/card";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    direction: "up" | "down" | "stable";
    value: string;
    label?: string;
  };
  color?: "default" | "blue" | "green" | "amber" | "red" | "purple" | "cyan";
  loading?: boolean;
  className?: string;
}

const colorMap = {
  default: { icon: "text-primary",    bg: "bg-primary/10" },
  blue:    { icon: "text-info",       bg: "bg-info/10" },
  green:   { icon: "text-success",    bg: "bg-success/10" },
  amber:   { icon: "text-warning",    bg: "bg-warning/10" },
  red:     { icon: "text-destructive", bg: "bg-destructive/10" },
  purple:  { icon: "text-purple-500", bg: "bg-purple-500/10" },
  cyan:    { icon: "text-cyan-500",   bg: "bg-cyan-500/10" },
};

const trendIcon = {
  up:     TrendingUp,
  down:   TrendingDown,
  stable: Minus,
};

const trendColor = {
  up:     "text-success",
  down:   "text-destructive",
  stable: "text-muted-foreground",
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "default",
  loading = false,
  className,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <CardContent className="p-0 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const colors = colorMap[color];
  const TrendIcon = trend ? trendIcon[trend.direction] : null;

  return (
    <Card className={cn("p-4 hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <div className={cn("p-2 rounded-lg", colors.bg)}>
              <Icon className={cn("h-4 w-4", colors.icon)} />
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {trend && TrendIcon && (
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon className={cn("h-3.5 w-3.5", trendColor[trend.direction])} />
            <span className={cn("text-xs font-medium", trendColor[trend.direction])}>
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Grid Container ────────────────────────────────────────

export interface StatsCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const gridCols = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function StatsCardGrid({ children, columns = 4, className }: StatsCardGridProps) {
  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
```

### Pattern: StatusBadge

```tsx
// libs/ui/src/patterns/status-badge/status-badge.tsx

import { Badge, type BadgeProps } from "@/components/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "active" | "inactive" | "pending" | "suspended"
  | "draft" | "expired" | "on-time" | "delayed"
  | "cancelled" | "completed" | "in-progress" | "scheduled";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active:       { label: "Active",      className: "bg-success/10 text-success border-success/20" },
  inactive:     { label: "Inactive",    className: "bg-muted text-muted-foreground border-muted" },
  pending:      { label: "Pending",     className: "bg-warning/10 text-warning border-warning/20" },
  suspended:    { label: "Suspended",   className: "bg-destructive/10 text-destructive border-destructive/20" },
  draft:        { label: "Draft",       className: "bg-info/10 text-info border-info/20" },
  expired:      { label: "Expired",     className: "bg-muted text-muted-foreground border-border" },
  "on-time":    { label: "On Time",     className: "bg-success/10 text-success border-success/20" },
  delayed:      { label: "Delayed",     className: "bg-warning/10 text-warning border-warning/20" },
  cancelled:    { label: "Cancelled",   className: "bg-destructive/10 text-destructive border-destructive/20" },
  completed:    { label: "Completed",   className: "bg-primary/10 text-primary border-primary/20" },
  "in-progress": { label: "In Progress", className: "bg-info/10 text-info border-info/20" },
  scheduled:    { label: "Scheduled",   className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType;
  label?: string; // Override default label
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className, className)}
      {...props}
    >
      <span className={cn(
        "mr-1.5 h-1.5 w-1.5 rounded-full",
        status === "active" || status === "on-time" || status === "completed"
          ? "bg-current"
          : "bg-current opacity-70"
      )} />
      {label ?? config.label}
    </Badge>
  );
}
```

### Pattern: ConfirmDialog

```tsx
// libs/ui/src/patterns/confirm-dialog/confirm-dialog.tsx

"use client";

import * as React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/alert-dialog";
import { buttonVariants } from "@/components/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              variant === "destructive" && buttonVariants({ variant: "destructive" })
            )}
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Complete Pattern List

| Pattern | Purpose | Composes |
|---------|---------|----------|
| `DataTable` | Sortable, paginated data display | Table, Skeleton |
| `DataTablePagination` | Table pagination controls | Pagination, Select |
| `DataTableToolbar` | Table toolbar (search + filters) | Input, Select, Button |
| `FilterBar` | Search + filter chips + controls | Input, Badge, Button |
| `StatsCard` | KPI metric card with trend | Card, icons |
| `StatsCardGrid` | Responsive grid for StatsCards | CSS Grid |
| `StatusBadge` | Semantic status indicator | Badge |
| `ConfirmDialog` | Confirmation modal for actions | AlertDialog, Button |
| `FormField` | Form field with label, error | Label, Input, FormMessage |
| `FormSection` | Grouped form fields with title | Card, Separator |
| `PageHeader` | Page title + breadcrumbs + actions | Breadcrumb, Button |
| `EmptyState` | Empty data placeholder with action | Card, Button, icon |
| `LoadingState` | Full-page loading indicator | Skeleton, Spinner |
| `SkeletonTable` | Table-shaped loading skeleton | Skeleton |
| `SkeletonCard` | Card-shaped loading skeleton | Skeleton |

---

## 6. Layer 4: Feature Components

**Location**: `apps/frontend/management-portal/src/components/features/`

Feature components are domain-specific. They:
- Import patterns from `@busmate/ui`
- Know about BusMate domain types (Route, BusStop, Schedule, etc.)
- Call API services
- Handle domain-specific business logic

### Example: RoutesTable (Feature Component)

```tsx
// apps/frontend/management-portal/src/components/features/routes/routes-table.tsx

"use client";

import { DataTable, type DataTableColumn, type SortState, StatusBadge } from "@busmate/ui";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@busmate/ui";
import type { RouteGroupResponseDTO } from "@busmate/api-client-route";

interface RoutesTableProps {
  data: RouteGroupResponseDTO[];
  loading: boolean;
  sort: SortState;
  onSort: (sort: SortState) => void;
  onView: (route: RouteGroupResponseDTO) => void;
  onEdit: (route: RouteGroupResponseDTO) => void;
  onDelete: (route: RouteGroupResponseDTO) => void;
}

export function RoutesTable({
  data, loading, sort, onSort, onView, onEdit, onDelete
}: RoutesTableProps) {
  const columns: DataTableColumn<RouteGroupResponseDTO>[] = [
    {
      key: "routeNumber",
      header: "Route Number",
      sortable: true,
      width: "120px",
      render: (row) => (
        <span className="font-mono font-medium">{row.routeNumber}</span>
      ),
    },
    {
      key: "routeName",
      header: "Route Name",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{row.routeName}</div>
          <div className="text-xs text-muted-foreground">
            {row.origin} → {row.destination}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (row) => (
        <StatusBadge status={row.status?.toLowerCase() as any ?? "draft"} />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(row) => row.routeGroupId ?? row.routeNumber}
      loading={loading}
      sort={sort}
      onSort={onSort}
      onRowClick={onView}
    />
  );
}
```

### Feature Components Per Module

```
src/components/features/
├── routes/
│   ├── routes-table.tsx
│   ├── routes-stats.tsx
│   ├── routes-filters.tsx
│   ├── route-form.tsx
│   ├── route-detail/
│   │   ├── route-overview.tsx
│   │   ├── route-stops-tab.tsx
│   │   ├── route-map-tab.tsx
│   │   ├── route-schedules-tab.tsx
│   │   └── route-analytics-tab.tsx
│   └── route-workspace/          # Complex workspace preserved
│       ├── form-mode/
│       ├── textual-mode/
│       └── ai-studio/
├── bus-stops/
│   ├── bus-stops-table.tsx
│   ├── bus-stops-stats.tsx
│   ├── bus-stops-filters.tsx
│   ├── bus-stop-form.tsx
│   └── bus-stop-detail.tsx
├── buses/
│   ├── buses-table.tsx
│   ├── buses-stats.tsx
│   ├── buses-filters.tsx
│   ├── bus-form.tsx
│   └── bus-detail.tsx
├── schedules/
│   ├── schedules-table.tsx
│   ├── schedules-stats.tsx
│   ├── schedules-filters.tsx
│   ├── schedule-detail/
│   └── schedule-workspace/       # Complex workspace preserved
├── trips/
│   ├── trips-table.tsx
│   ├── trips-stats.tsx
│   ├── trips-filters.tsx
│   ├── trip-detail/
│   └── trip-assignment/
├── operators/
│   ├── operators-table.tsx
│   ├── operators-stats.tsx
│   ├── operators-filters.tsx
│   └── operator-form.tsx
├── staff/
│   ├── staff-table.tsx
│   ├── staff-stats.tsx
│   ├── staff-filters.tsx
│   └── staff-form.tsx
├── fares/
│   ├── fare-matrix-table.tsx
│   ├── fare-amendments-table.tsx
│   └── fare-form.tsx
├── analytics/
│   ├── analytics-overview.tsx
│   └── analytics-charts.tsx
├── dashboard/
│   ├── dashboard-kpis.tsx
│   ├── dashboard-activity.tsx
│   ├── dashboard-alerts.tsx
│   └── dashboard-widgets.tsx
├── notifications/
│   ├── notifications-table.tsx
│   └── compose-notification.tsx
├── permits/
│   ├── permits-table.tsx
│   └── permit-form.tsx
└── policies/
    ├── policies-table.tsx
    └── policy-form.tsx
```

---

## 7. Layer 5: Pages

**Location**: `apps/frontend/management-portal/src/app/`

Pages are thin orchestrators. They:
- Set page metadata (title, breadcrumbs)
- Manage page-level state
- Compose feature components
- Handle routing/navigation

### Example: Refactored Routes Page

```tsx
// apps/frontend/management-portal/src/app/mot/routes/page.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsCardGrid } from "@busmate/ui";
import { useSetPageMetadata, useSetPageActions } from "@/context/PageContext";
import { RoutesTable } from "@/components/features/routes/routes-table";
import { RoutesStats } from "@/components/features/routes/routes-stats";
import { RoutesFilters } from "@/components/features/routes/routes-filters";
import { useRoutesData } from "@/hooks/useRoutesData";
import { Button } from "@busmate/ui";
import { Plus, Upload } from "lucide-react";

export default function RoutesPage() {
  const router = useRouter();

  // ── Page metadata ──────────────────────────────
  useSetPageMetadata({
    title: "Routes Management",
    description: "Manage public bus routes across the network",
    activeItem: "routes",
    breadcrumbs: [{ label: "Routes" }],
  });

  useSetPageActions(
    <>
      <Button variant="outline" onClick={() => router.push("/mot/routes/import")}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button onClick={() => router.push("/mot/routes/workspace")}>
        <Plus className="h-4 w-4 mr-2" />
        Create Route
      </Button>
    </>
  );

  // ── Data hook (encapsulates fetching, filtering, sorting, pagination) ──
  const {
    routes, stats, loading, filters, sort, pagination,
    setFilters, setSort, setPagination,
  } = useRoutesData();

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <RoutesStats stats={stats} loading={loading} />

      {/* Filters */}
      <RoutesFilters filters={filters} onFiltersChange={setFilters} />

      {/* Data Table */}
      <RoutesTable
        data={routes}
        loading={loading}
        sort={sort}
        onSort={setSort}
        onView={(route) => router.push(`/mot/routes/${route.routeGroupId}`)}
        onEdit={(route) => router.push(`/mot/routes/workspace?edit=${route.routeGroupId}`)}
        onDelete={(route) => {/* open delete dialog */}}
      />
    </div>
  );
}
```

**Key improvement**: The page is ~50 lines instead of 555. All logic is encapsulated in:
- `useRoutesData()` — data fetching + state
- Feature components — domain-specific UI
- Patterns — reusable table, stats, filters

---

## 8. Component Communication

### 8.1 Props Down, Events Up

```
Page (state owner)
  │
  ├── passes data props ──▶ FeatureComponent
  │   onEvent callback ◀── FeatureComponent
  │
  ├── passes data props ──▶ Pattern
  │   onEvent callback ◀── Pattern
```

### 8.2 Context for Cross-Cutting Concerns

| Context | Scope | Usage |
|---------|-------|-------|
| `PageContext` | Layout → Page | Page title, breadcrumbs, actions |
| `RouteWorkspaceContext` | Workspace page → children | Route editor state |
| `ScheduleWorkspaceContext` | Workspace page → children | Schedule editor state |
| `ThemeContext` | Root → all | Light/dark mode (via `next-themes`) |

### 8.3 Custom Hooks for Data

```tsx
// Extract complex data logic into hooks

// ✅ Encapsulated data hook
function useRoutesData() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ column: "routeNumber", direction: "asc" });
  const [pagination, setPagination] = useState({ page: 0, size: 10 });

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RouteManagementService.searchRouteGroups({
        ...filters, ...sort, ...pagination
      });
      setRoutes(data.content);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, pagination]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  return { routes, loading, filters, sort, pagination, setFilters, setSort, setPagination };
}
```

---

## 9. File & Naming Conventions

### File Names

| Layer | Convention | Example |
|-------|-----------|---------|
| Base components | kebab-case | `button.tsx`, `dropdown-menu.tsx` |
| Patterns | kebab-case | `data-table.tsx`, `stats-card.tsx` |
| Feature components | kebab-case | `routes-table.tsx`, `bus-stop-form.tsx` |
| Pages | Next.js convention | `page.tsx`, `layout.tsx`, `loading.tsx` |
| Hooks | camelCase with `use` prefix | `useRoutesData.ts`, `useMobile.ts` |
| Types | PascalCase | `RouteWorkspaceData.ts` |

### Component Names

| Layer | Convention | Example |
|-------|-----------|---------|
| Base components | PascalCase | `Button`, `Card`, `Dialog` |
| Patterns | PascalCase, descriptive | `DataTable`, `StatsCard`, `FilterBar` |
| Feature components | PascalCase, domain-prefixed | `RoutesTable`, `BusStopForm` |
| Pages | `default export` function | `export default function RoutesPage()` |

### Directory Structure Rules

1. **One component per file** (except closely related sub-components)
2. **`index.ts` barrel exports** for directories with multiple files
3. **Co-locate related files**: Types, tests, and stories with their component
4. **Flat structure** preferred; nest only when a component has sub-components

---

## 10. Component Decision Tree

When building new UI, follow this decision tree:

```
┌──────────────────────────────────────────────────────┐
│        "I need to display [X] in the UI"             │
│                                                       │
│  Does a shadcn base component handle this?            │
│  ├── YES → Use it from @busmate/ui                    │
│  └── NO ↓                                             │
│                                                       │
│  Does a pattern in @busmate/ui handle this?           │
│  ├── YES → Use it, pass domain data via props         │
│  └── NO ↓                                             │
│                                                       │
│  Is this UI reusable across multiple features?        │
│  ├── YES → Create a new PATTERN in libs/ui/patterns/  │
│  └── NO ↓                                             │
│                                                       │
│  Is this domain-specific UI?                          │
│  ├── YES → Create a FEATURE COMPONENT in              │
│  │         src/components/features/{module}/           │
│  └── NO → Create a page-local component               │
│                                                       │
│  NEVER:                                               │
│  ✗ Directly use Radix primitives in feature code      │
│  ✗ Duplicate existing patterns with minor changes     │
│  ✗ Put domain logic in libs/ui/                       │
│  ✗ Create a new base component when shadcn has one    │
└──────────────────────────────────────────────────────┘
```

---

## Summary

| Layer | Location | Count | Responsibility |
|-------|----------|-------|----------------|
| 0 - Tokens | `libs/ui/theme/` | ~8 files | CSS custom properties |
| 1 - Primitives | `node_modules/@radix-ui/` | ~20 packages | Accessibility, behavior |
| 2 - Base | `libs/ui/src/components/` | ~35 files | Styled, variant-driven components |
| 3 - Patterns | `libs/ui/src/patterns/` | ~15 patterns | Composed, reusable UI blocks |
| 4 - Features | `src/components/features/` | ~60+ files | Domain-specific components |
| 5 - Pages | `src/app/` | ~50+ pages | Thin orchestrators |

---

## Next Steps

Proceed to **[05 — Layout and Navigation Architecture](./05-layout-and-navigation-architecture.md)** to define the global layout shell, sidebar navigation, and responsive design strategy.
